---
title: "Cold Boot"
date: 2026-05-16
description: "No articles yet. This is a placeholder, and also a typesetting check - here is what every post will look like when one lands."
date: "2026-05-14"
draft: false
---

Nothing has been posted yet. This entry exists to occupy the index page and
to verify that everything below it renders the way it should.

When real posts arrive, they will live here in reverse-chronological order.
The plan is to cover Windows internals work in three rough categories:

- **Kernel research** — what changes between builds, what is reachable from
  user mode and what isn't, post-mortems on techniques that no longer work.
- **Reverse engineering** — short field manuals for the parts of WinDbg and
  IDA that I keep having to re-learn.
- **Threat-side notes** — observations from samples I have looked at, with
  identifying detail stripped.

## What a post looks like

A typical post has a few sentences of prose, then a section heading, then
code. Inline things like `KSPIN_LOCK` and `_EPROCESS->Peb` should sit cleanly
inside a sentence without breaking line height. *Italic* for emphasis,
**bold** for the rare load-bearing word — strong typesetting matters here.
The posts are dense, and the reader is usually tired.

### Code blocks

C and C++ are the default, but the highlighter ships with grammars for
several other languages too. Each block gets a copy button and a language
label.

```c
// Driver entry — what every kernel-mode post will quote at least once.
NTSTATUS
DriverEntry(PDRIVER_OBJECT DriverObject, PUNICODE_STRING RegistryPath)
{
    UNREFERENCED_PARAMETER(RegistryPath);
    DriverObject->DriverUnload = OnUnload;
    return STATUS_SUCCESS;
}
```

```powershell
# Spin up an ETW session against the threat-intelligence provider.
$guid = "{F4E1897C-BB5D-5668-F1D8-040F4D8DD344}"
logman start itr0-session -p $guid -o trace.etl -ets
```

```python
# Walk a captured kernel pool dump for a known tag.
from struct import unpack
with open("pool.bin", "rb") as f:
    while chunk := f.read(0x10):
        tag, = unpack("4s", chunk[8:12])
        if tag == b"Proc":
            print(hex(f.tell() - 0x10))
```

### Asides and footnotes

Some thoughts need to interrupt the flow without breaking it. Sidenotes are
for "here's a detail you'll want if you're already paying attention" — they
sit in the margin of the reading experience.

<aside class="sidenote">
<strong class="sidenote__label">Sidenote</strong>
Footnotes<sup class="footnote-ref">1</sup> are also supported, but kept at
the bottom of the post. Use them for references and disambiguation.
</aside>

### Headings

`<h2>` starts a section. `<h3>` is a subsection. Beyond that, you're nesting
too deep and the post needs to be split.

## Until then

The RSS feed in the header will go live once the first real article ships.
Expect that to be soon.

<p class="footnote">
<sup>1</sup> Footnotes use the same monospace styling as the metadata row so
they sit visually with citation marks rather than body prose.
</p>
