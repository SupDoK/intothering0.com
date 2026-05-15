---
title: "Process Hollowing on Windows 11 24H2"
date: 2026-03-15
description: "Revisiting the classic RunPE technique against updated Defender telemetry and ETW providers in the Windows 11 24H2 build."
draft: false
---

# Process Hollowing on Windows 11 24H2

Process hollowing (RunPE) has been a staple technique since roughly 2012. The premise is
simple: spawn a legitimate host process suspended, unmap its image, write your payload in
its place, patch the thread context, then resume. Modern EDRs have made the naive
implementation trivially detectable, but understanding it is still valuable — its
fingerprints appear in commodity crimeware and more targeted operators alike.

## The Classic Flow

```c
// 1. Spawn host in suspended state
CreateProcess(
    "C:\\Windows\\System32\\svchost.exe",
    NULL, NULL, NULL, FALSE,
    CREATE_SUSPENDED,
    NULL, NULL, &si, &pi
);

// 2. Unmap the legitimate image
NtUnmapViewOfSection(pi.hProcess, hostImageBase);

// 3. Allocate memory for payload at payload's preferred base
VirtualAllocEx(
    pi.hProcess, payloadPreferredBase,
    payloadSize,
    MEM_COMMIT | MEM_RESERVE,
    PAGE_EXECUTE_READWRITE
);

// 4. Write PE headers + sections, fix relocations if needed
// 5. Update RCX/Rcx via SetThreadContext to new entry point
// 6. ResumeThread(pi.hThread)
```

## What Defender Sees on 24H2

Relevant telemetry on a stock 24H2 box:

- **ETW `Microsoft-Windows-Threat-Intelligence` (ETWTI)** — kernel provider.
  Fires on `VirtualAllocEx` with `MEM_COMMIT | MEM_RESERVE` into a remote process
  and on `WriteProcessMemory` when the target address falls inside a `SEC_IMAGE`
  region.

- **`PsSetCreateProcessNotifyRoutine` callbacks** — process creation. The spawned
  process image will appear as `svchost.exe` in creation events, but querying
  `ProcessImageFileName` via `NtQueryInformationProcess` returns the real path
  up until the swap completes.

- **Image-load events** — your payload's headers aren't backed by a file on
  disk. NTFS minifilter callbacks and AV/EDR sensors can flag the discrepancy
  between mapped-executable memory and the absence of a corresponding file handle.

## Removing Obvious Signals

Replacing `NtUnmapViewOfSection + VirtualAllocEx` with an in-place section
overwrite (no unmap) removes one telemetry event. Using `NtCreateSection +
NtMapViewOfSection` instead of `VirtualAllocEx` changes the allocation path and
slips past some heuristics — ETWTI still fires on `NtMapViewOfSection` with
execute permissions, but the callstack looks different.

The harder problem is the *not-backed-by-file* heuristic. `SEC_IMAGE` sections have
an associated file handle; anonymous `VirtualAllocEx` allocations do not. Resolving
this cleanly requires either a transacted file write or mapping from an existing
legitimate section — both raise their own flags.

## Takeaway

Process hollowing is well-covered by sensors today. It's worth studying because:

1. You learn exactly where Windows records process identity and how fragile that
   recording is under direct manipulation.
2. Subtle variants still appear in the wild, and defenders need to understand the
   detection surface to evaluate their coverage accurately.
3. The same primitives (`NtUnmapViewOfSection`, `VirtualAllocEx`, `WriteProcessMemory`,
   `SetThreadContext`) appear in many adjacent techniques — understanding one teaches
   you the vocabulary for all of them.
