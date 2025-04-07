# Gource-Tools

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

<img src="https://raw.githubusercontent.com/bitpaint/bitcoin-gources/main/gource/art/screenshoot.jpg" alt="Gource-Tools Screenshot" width="690px">

## What is Gource-Tools?

Gource-Tools is a comprehensive toolkit designed to enhance and streamline the process of visualizing Git repository history using [Gource](https://gource.io/). It provides a suite of bash scripts that automate the following workflow:

1. **Repository management** - Download multiple Git repositories from a list or a GitHub username
2. **Log generation** - Create and combine Gource log files from multiple repositories
3. **Avatar handling** - Automatically download contributor avatars from Gravatar
4. **Visualization** - Configure and run interactive Gource visualizations
5. **Video rendering** - Generate high-quality video files of repository history

This toolkit is particularly valuable for visualizing large-scale projects with multiple repositories, creating impressive demonstrations of project evolution, and analyzing contributor activity patterns.

## Features

- **Multi-repository support**: Manage and visualize multiple repositories as a unified project
- **Automatic avatar integration**: Enhance visualizations with contributor profile images
- **Flexible configuration**: Customize visualization parameters (date ranges, speed, etc.)
- **Interactive exploration**: Explore repository history interactively
- **High-quality rendering**: Create shareable videos in HD (1080p) and 4K resolution
- **User-specific filtering**: Generate visualizations filtered to specific contributors
- **Custom color schemes**: Modify visualization colors for better aesthetics

## Requirements

### Core Requirements (for basic usage)
- `git` - For repository operations
- `gource` - For visualization
- `sed` - For log file processing

### Optional Requirements
- `FFmpeg` - For video rendering
- `imagemagick` - For avatar processing
- `perl` with CPAN module `Parallel::ForkManager` - For parallel avatar downloads

### Installation Links (for Windows users)

- `git`: [Git for Windows](https://gitforwindows.org/) - Download "64-bit Git for Windows Setup"
- `gource`: [Gource Releases](https://github.com/acaudwell/Gource/releases/tag/gource-0.51) - Download "gource-VERSION.win64-setup.exe"
- `sed`: [GNU Win32 Sed](https://sourceforge.net/projects/gnuwin32/files//sed/4.2.1/sed-4.2.1-setup.exe/download) - Download "sed-VERSION-setup.exe"
- `perl`: [Strawberry Perl](https://strawberryperl.com/) - Download "strawberry-perl-VERSION-64bit.msi"
- `imagemagick`: [ImageMagick](https://imagemagick.org/script/download.php#windows) - Download "Win64 dynamic at 16 bits-per-pixel..."
- `FFmpeg`: Included with ImageMagick - Check the "install FFmpeg" box during installation

## Getting Started

### Initial Setup

1. **Clone this repository**:
   ```bash
   git clone https://github.com/yourusername/Gource-Tools.git
   cd Gource-Tools
   ```

2. **Configure repository sources**:
   Edit `config/repos-list.txt` to include the URLs of the repositories you want to visualize, one per line.

3. **Initialize the environment**:
   ```bash
   ./START.sh
   ```
   Select option 1 to "Download repos from list"

### Basic Workflow

1. **Download repositories**: Options 1-2 in the main menu
2. **Download avatars**: Option 3 in the main menu
3. **Generate logs**: Option 6 in the main menu
4. **Combine logs**: Option 8 in the main menu
5. **Explore or render**: Options 10-11 in the main menu

## Usage Examples

### Visualizing Multiple Repositories with Avatars

```bash
# Edit config/repos-list.txt with repository URLs
./START.sh
# Select option 4 (Download repos and avatars)
# Select option 6 (Make Gource log files)
# Select option 8 (Combine all logs)
# Select option 10 (Explore) or 11 (Render video)
```

### Updating Repositories and Regenerating Logs

```bash
./START.sh
# Select option 9 (Update all repos and make new logs)
# Select option 10 (Explore) or 11 (Render video)
```

## Project Structure

```
Gource-Tools/
├── config/               # Configuration files
│   ├── repos-list.txt    # List of repository URLs
│   └── audio.mp3         # Custom audio for rendered videos
├── src/                  # Source scripts
│   ├── menu/             # Main menu scripts
│   ├── dl-repos/         # Repository download scripts
│   ├── dl-avatars/       # Avatar download scripts
│   ├── logs-maker/       # Log generation scripts
│   ├── logs-colorizer/   # Log customization scripts
│   ├── rendering/        # Visualization scripts
│   ├── update-repos/     # Repository update scripts
│   └── reset/            # Environment reset scripts
├── repos/                # Downloaded repositories (generated)
├── logs/                 # Generated log files (generated)
├── avatars/              # Downloaded avatars (generated)
└── renders/              # Rendered videos (generated)
```

## Customization

- **Audio**: Replace `config/audio.mp3` with a custom audio file for video rendering
- **Colors**: Use option 7 (Color patcher) to customize visualization colors
- **Rendering options**: Edit rendering scripts to adjust quality, resolution, etc.

## Modernization Plans

This project is currently undergoing modernization efforts:

1. **Web Interface**: Creating a modern web-based UI for configuration and control
2. **Cross-platform compatibility**: Improving support for various operating systems
3. **Enhanced documentation**: Expanding documentation with detailed guides
4. **Modular architecture**: Refactoring into a more maintainable structure
5. **Containerization**: Adding Docker support for easier deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original music from [Chris Zabriskie](http://chriszabriskie.com/vendaface/)
- Gource visualization engine by [Andrew Caudwell](https://github.com/acaudwell/Gource)

## Contact

For support or questions:
- Telegram: **@bitpaint**
- Twitter: **@bitpaintclub**

---

<img src="https://raw.githubusercontent.com/bitpaint/bitcoin-gources/main/gource/art/4k/2.png" alt="Gource Visualization" width="690px">
