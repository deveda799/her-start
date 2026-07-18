# Upload Files & Knowledge Base

## File and Folder Management

CodeBanana's file management is located in the project list on the left side of the Studio page.

### How to Upload

Click **"…"** on a project or folder:

| Action | Description |
|--------|-------------|
| **Upload file** | Upload a single file |
| **Upload folder** | Upload an entire folder |

> Both top-level directories (projects) and sub-directories (folders) support uploads — just click "…" at the corresponding level.

Once uploaded, these files automatically become part of the project's knowledge. The Agent can read and understand them directly — no need to paste content or explain what the file is. Just say "analyze the report I just uploaded" and it's done.

### Upload Limits

| Limit | Maximum |
|-------|---------|
| **Single file size** | Up to **100MB** |
| **Number of images** | Up to **10** |
| **Total files (including images)** | Up to **50** |

### Supported File Formats

Virtually every format you can think of is supported:

| Category | Common Formats |
|----------|---------------|
| **Code** | .js, .ts, .py, .java, .go, .cpp, .c, .rs, .rb, .php, .swift, .kt, etc. |
| **Frontend** | .html, .css, .scss, .less, .jsx, .tsx, .vue, .svelte, etc. |
| **Documents** | .md, .txt, .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .csv, etc. |
| **Images** | .png, .jpg, .jpeg, .gif, .svg, .webp, .ico, .bmp, etc. |
| **Audio** | .mp3, .wav, .aac, .ogg, .flac, .m4a, etc. |
| **Video** | .mp4, .mov, .avi, .webm, .mkv, etc. |
| **Config** | .json, .yaml, .yml, .toml, .xml, .env, .ini, etc. |
| **Design** | .figma, .sketch, .psd, .ai, etc. |
| **Archives** | .zip, .rar, .tar, .gz, .7z, etc. |

### Other File Operations

| Action | Description |
|--------|-------------|
| **Rename** | Rename a file or folder |
| **New File / New Folder** | Create a new file or folder |
| **Copy Path** | Copy the relative path (relative to the project root) |
| **Download** | Download a file or folder |
| **Duplicate to** | Copy to another location |
| **Move to** | Move to another location |
| **Delete Project** | Delete the project (requires Agent permissions) |

## Shared Context

This is one of CodeBanana's most powerful features: all files uploaded to a project automatically become shared knowledge for the entire team and AI.

- AI and team members all work from the same repo, the same files, the same knowledge
- No need to repeatedly share files or sync manually
- When a new member joins, all historical materials are already there — no onboarding from scratch

> Imagine this: the product manager uploads a requirements doc, the designer uploads mockups, and the developer tells the Agent to write code based on these materials — everyone sees the same source of truth. No more "which version are you looking at?"

## Message Forwarding (Forward)

- AI incorporates context from multi-person discussions into subsequent coding, reducing repetitive communication
- Supports forwarding individual or batch messages to different groups, different agents, or the Discussion tab

## End-to-End Context Sharing (Preview)

- Designers can understand what's being developed
- PMs can see logic files and changes
- QA can jump directly to code implementation
