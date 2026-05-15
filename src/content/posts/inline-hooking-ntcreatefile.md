---
title: "Inline Hooking NtCreateFile in User Mode"
date: 2026-04-22
description: "Setting up an x64 inline hook on NtCreateFile with a proper trampoline: overwriting bytes, building the jump-back, and thread safety considerations."
draft: false
---

# Inline Hooking NtCreateFile in User Mode

Inline hooking overwrites the first few bytes of a target function with a jump to your
detour. A trampoline preserves the original bytes and jumps back, so the real function
still executes. This post focuses on `NtCreateFile` — the syscall stub in ntdll that
every file-open ultimately reaches.

## The Target: NtCreateFile in ntdll

On a stock Windows 11 x64 system, the first bytes of `NtCreateFile` look like:

```asm
; ntdll!NtCreateFile
4C 8B D1        mov r10, rcx
B8 55 00 00 00  mov eax, 55h        ; syscall number (varies by build)
0F 05           syscall
C3              ret
```

We'll install a 14-byte absolute jump before the `syscall`:

```asm
; 14-byte abs jump: mov rax, <addr64> ; jmp rax
48 B8 xx xx xx xx xx xx xx xx   ; mov rax, imm64
FF E0                            ; jmp rax
```

## Building the Trampoline

The trampoline buffer must:
1. Execute the 14 bytes we overwrote
2. Jump back to `NtCreateFile + 14`

```c
#define HOOK_SIZE 14

typedef struct {
    BYTE saved[HOOK_SIZE];     // copy of original bytes
    BYTE jmp_back[14];         // abs jump to NtCreateFile+HOOK_SIZE
} TRAMPOLINE;

TRAMPOLINE* install_hook(PVOID target, PVOID detour) {
    TRAMPOLINE* tramp = VirtualAlloc(
        NULL, sizeof(TRAMPOLINE),
        MEM_COMMIT | MEM_RESERVE,
        PAGE_EXECUTE_READWRITE
    );

    memcpy(tramp->saved, target, HOOK_SIZE);

    // Build jump-back: mov rax, (target+14); jmp rax
    BYTE jmpback[14] = { 0x48,0xB8, 0,0,0,0,0,0,0,0, 0xFF,0xE0, 0x90,0x90 };
    ULONG_PTR ret_addr = (ULONG_PTR)target + HOOK_SIZE;
    memcpy(jmpback + 2, &ret_addr, 8);
    memcpy(tramp->jmp_back, jmpback, sizeof(jmpback));

    // Write the hook: mov rax, detour; jmp rax
    BYTE hook[14] = { 0x48,0xB8, 0,0,0,0,0,0,0,0, 0xFF,0xE0, 0x90,0x90 };
    ULONG_PTR det = (ULONG_PTR)detour;
    memcpy(hook + 2, &det, 8);

    DWORD old;
    VirtualProtect(target, HOOK_SIZE, PAGE_EXECUTE_READWRITE, &old);
    memcpy(target, hook, HOOK_SIZE);
    VirtualProtect(target, HOOK_SIZE, old, &old);

    FlushInstructionCache(GetCurrentProcess(), target, HOOK_SIZE);
    return tramp;
}
```

## Thread Safety

Writing 14 bytes is not atomic. A thread executing `NtCreateFile` concurrently
can read a torn instruction sequence and crash. In a single-threaded harness you
can ignore this. In a real injected DLL you have two main options:

- **Suspend all threads** before patching (`NtSuspendThread` on every thread except
  your own). Coarse but reliable.
- **Atomic 8-byte write** — if the 8-byte jump displacement is naturally aligned,
  some architectures guarantee an atomic store. Guaranteeing alignment in mapped
  ntdll memory is non-trivial.

For a hook installed at DLL load time, before the process is fully multi-threaded,
thread safety is rarely a practical concern.

## The Detour

```c
typedef NTSTATUS (NTAPI *NtCreateFile_t)(
    PHANDLE, ACCESS_MASK, POBJECT_ATTRIBUTES,
    PIO_STATUS_BLOCK, PLARGE_INTEGER, ULONG,
    ULONG, ULONG, ULONG, PVOID, ULONG
);

NTSTATUS NTAPI NtCreateFile_hook(
    PHANDLE            FileHandle,
    ACCESS_MASK        DesiredAccess,
    POBJECT_ATTRIBUTES ObjectAttributes,
    PIO_STATUS_BLOCK   IoStatusBlock,
    PLARGE_INTEGER     AllocationSize,
    ULONG              FileAttributes,
    ULONG              ShareAccess,
    ULONG              CreateDisposition,
    ULONG              CreateOptions,
    PVOID              EaBuffer,
    ULONG              EaLength)
{
    if (ObjectAttributes && ObjectAttributes->ObjectName)
        log_unicode_string(ObjectAttributes->ObjectName);

    // Call original via trampoline (saved bytes + jump-back)
    return ((NtCreateFile_t)g_tramp->saved)(
        FileHandle, DesiredAccess, ObjectAttributes,
        IoStatusBlock, AllocationSize, FileAttributes,
        ShareAccess, CreateDisposition, CreateOptions,
        EaBuffer, EaLength
    );
}
```

## Caveats

Control Flow Guard (CFG) does not block this approach — you're modifying the
function's mapped bytes directly, not going through the CFG dispatch bitmap.
CFG only guards indirect call/jump targets.

If you'd rather intercept at a higher level (e.g., `CreateFileW` in `KernelBase.dll`),
the identical technique applies and you avoid syscall stub churn between OS builds.
