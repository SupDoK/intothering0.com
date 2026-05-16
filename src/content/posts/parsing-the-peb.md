---
title: "Parsing the PEB Without windows.h"
date: 2026-02-08
description: "Walking the Process Environment Block by hand to resolve exports — the foundational technique behind shellcode and reflective loaders."
draft: true
---

# Parsing the PEB Without windows.h

When writing shellcode or a reflective DLL loader, you can't rely on `windows.h` or the
linker resolving your import table. You need to locate `kernel32` and `ntdll` yourself —
and the canonical approach is walking the PEB.

## What the PEB Is

The Process Environment Block is a user-mode structure Windows populates for every
process. It lives at a well-known offset from the Thread Environment Block (TEB), which
is always reachable via the `GS` segment register on x64:

```c
// x64: GS:[0x60] points to the PEB
PPEB pPEB = (PPEB)__readgsqword(0x60);
```

Inside the PEB, `Ldr` points to a `PEB_LDR_DATA` structure containing three
doubly-linked lists of all loaded modules. We care about `InMemoryOrderModuleList`.

## Walking the Module List

```c
typedef struct _LDR_DATA_TABLE_ENTRY {
    LIST_ENTRY InLoadOrderLinks;
    LIST_ENTRY InMemoryOrderLinks;
    LIST_ENTRY InInitializationOrderLinks;
    PVOID          DllBase;
    PVOID          EntryPoint;
    ULONG          SizeOfImage;
    UNICODE_STRING FullDllName;
    UNICODE_STRING BaseDllName;
    // ...
} LDR_DATA_TABLE_ENTRY;

PLIST_ENTRY head = &pPEB->Ldr->InMemoryOrderModuleList;
PLIST_ENTRY curr = head->Flink;

while (curr != head) {
    PLDR_DATA_TABLE_ENTRY entry = CONTAINING_RECORD(
        curr,
        LDR_DATA_TABLE_ENTRY,
        InMemoryOrderLinks
    );
    // entry->DllBase  = base address of this module
    // entry->BaseDllName = module name as UNICODE_STRING
    curr = curr->Flink;
}
```

## Hashing Module Names

Comparing wide-character strings directly would require a `wcscmp` equivalent —
which you haven't resolved yet. The standard trick is to pre-compute a hash and
compare hashes as you walk:

```c
DWORD djb2_wide(PWSTR str) {
    DWORD hash = 5381;
    while (*str) {
        WCHAR c = *str++;
        if (c >= L'A' && c <= L'Z') c |= 0x20; // tolower
        hash = ((hash << 5) + hash) ^ (DWORD)c;
    }
    return hash;
}
```

Once you've located a module's base address, parse its PE export directory to
resolve function pointers — but that's a topic for the next post.

## Why This Matters

Every modern shellcode loader, reflective injector, and position-independent
implant starts here. Understanding the PEB walk reveals how injected code
bootstraps itself before it can call a single Windows API function.
