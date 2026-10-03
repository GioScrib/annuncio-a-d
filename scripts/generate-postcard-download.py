"""Generate the local-file download payload without changing the JPEG bytes."""

import base64
from pathlib import Path


project = Path(__file__).resolve().parents[1]
encoded = base64.b64encode((project / "assets/invito.jpg").read_bytes()).decode("ascii")
payload = (
    "// Generated from invito.jpg. Regenerate with python3 scripts/generate-postcard-download.py\n"
    "document.currentScript.dispatchEvent(new CustomEvent('postcard-download-ready', {\n"
    "  detail: new Blob([Uint8Array.from(atob('"
    + encoded
    + "'), char => char.charCodeAt(0))], { type: 'image/jpeg' })\n"
    "}));\n"
)
(project / "assets/invito-download.js").write_text(payload, encoding="utf-8")
