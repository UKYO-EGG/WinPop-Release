# WinPop Beta

WinPopは、iPhone側アプリ不要・ログイン不要・クラウド不要で、同じWi-Fi上のiPhoneからWindowsへ写真・ファイル・URL・テキストを送れるWindows向け転送ツールです。

Official site: https://winpop.pages.dev/

WinPop is a local iPhone-to-Windows handoff app. It is designed for beginner-friendly iPhone Windows file transfer, especially when AirDrop cannot be used with a Windows PC.

- No iPhone app required
- No forced login
- No cloud upload required for the transfer flow
- Uses the same Wi-Fi network
- Connects by QR code
- Supports files, photos, URLs, and text
- Uses `WinPop Box` in your user folder as the default file location
- Shows a first-launch guide with optional PC setup helpers for desktop shortcuts and Explorer access

## Download

For the beta initial public release, WinPop is distributed as the installer only:

```text
Usually choose this: WinPop_Setup_0.9.1-beta.1.exe
```

Download from the official site:

https://winpop.pages.dev/

An install-free zip is not published in the initial beta. It may be added later if users ask for it.

## Windows SmartScreen Notice

WinPop is currently a free beta app from an individual developer. Because this early release is unsigned, Windows SmartScreen or other security software may show a warning during download, installation, or first launch.

If Windows shows "Windows protected your PC" and the "Run" button is not visible, choosing "More info" may show the "Run" button. Confirm that the installer came from the official site or the linked GitHub Release, review the warning, and decide whether to continue.

Do not disable Windows security features just to run WinPop.

## Development Start

1. Install Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

2. Start WinPop:

```powershell
python app.py
```

3. Open the QR or connection URL on your iPhone while both devices are on the same local network.

On first launch, WinPop shows a short guide for QR connection, iPhone-to-PC sending, PC-to-iPhone handoff, and the optional iPhone Shortcut flow. The guide stores its seen flag in `%APPDATA%\WinPop\settings.json` and can be shown again from the desktop app.

You can also use:

```powershell
.\start.bat
.\diagnose.bat
```

## Local Config

`config.json` is local generated state. It may contain access keys, shortcut tokens, device identity, save-folder paths, and other user-specific values.

Do not commit or distribute `config.json`.
Use `config.example.json` as the safe reference file.

If `config.json` is missing, WinPop regenerates it on startup.

## Development Notes

- Keep cache, logs, build outputs, and generated thumbnails out of Git.
- Keep large features out of `app.py` and `desktop_app.py`; prefer focused `winpop_*.py` modules.
- Follow `AGENTS.md` for Codex cleanup and token-budget rules.
- See `DEVELOPER.md` for setup details.

## Privacy

WinPop is intended for same-network local transfer.
Do not expose the local server to the public internet.

See `PRIVACY.md` for the current privacy note.
