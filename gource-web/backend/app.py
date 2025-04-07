import os
import json
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import git
import shutil
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuration
BASE_DIR = Path(__file__).parent.parent.absolute()
REPOS_DIR = BASE_DIR / "repos"
LOGS_DIR = BASE_DIR / "logs"
AVATARS_DIR = BASE_DIR / "avatars"
RENDERS_DIR = BASE_DIR / "renders"
CONFIG_DIR = BASE_DIR / "config"

# Ensure directories exist
for directory in [REPOS_DIR, LOGS_DIR, AVATARS_DIR, RENDERS_DIR, CONFIG_DIR]:
    directory.mkdir(exist_ok=True)

# API Configuration file
CONFIG_FILE = CONFIG_DIR / "config.json"
if not CONFIG_FILE.exists():
    default_config = {
        "github_api_key": "",
        "default_render_settings": {
            "resolution": "1920x1080",
            "seconds_per_day": 8.57,
            "hide": ["progress", "mouse", "filenames", "root"]
        }
    }
    with open(CONFIG_FILE, 'w') as f:
        json.dump(default_config, f, indent=2)

# Chargement de la configuration
def load_config():
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

@app.route('/api/config', methods=['GET', 'PUT'])
def config_handler():
    if request.method == 'GET':
        return jsonify(load_config())
    elif request.method == 'PUT':
        new_config = request.json
        with open(CONFIG_FILE, 'w') as f:
            json.dump(new_config, f, indent=2)
        return jsonify({"status": "success"})

@app.route('/api/repositories', methods=['GET', 'POST'])
def repositories():
    if request.method == 'GET':
        repos = []
        for repo_dir in REPOS_DIR.iterdir():
            if repo_dir.is_dir() and (repo_dir / '.git').exists():
                repos.append(repo_dir.name)
        return jsonify(repos)
    
    elif request.method == 'POST':
        data = request.json
        repo_url = data.get('url')
        if not repo_url:
            return jsonify({"error": "Repository URL is required"}), 400
        
        try:
            repo_name = repo_url.split('/')[-1]
            if repo_name.endswith('.git'):
                repo_name = repo_name[:-4]
            
            repo_path = REPOS_DIR / repo_name
            if repo_path.exists():
                return jsonify({"error": f"Repository {repo_name} already exists"}), 400
            
            git.Repo.clone_from(repo_url, repo_path)
            return jsonify({"status": "success", "repository": repo_name})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/repositories/<repo_name>', methods=['DELETE'])
def delete_repository(repo_name):
    repo_path = REPOS_DIR / repo_name
    if not repo_path.exists():
        return jsonify({"error": f"Repository {repo_name} not found"}), 404
    
    try:
        shutil.rmtree(repo_path)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        logs = []
        for log_file in LOGS_DIR.glob('*.txt'):
            logs.append(str(log_file.name))
        return jsonify(logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/logs/generate', methods=['POST'])
def generate_logs():
    data = request.json
    repo_names = data.get('repositories', [])
    
    if not repo_names:
        # Si aucun dépôt spécifié, utiliser tous les dépôts
        repo_names = [repo.name for repo in REPOS_DIR.iterdir() if repo.is_dir() and (repo / '.git').exists()]
    
    log_files = []
    for repo_name in repo_names:
        repo_path = REPOS_DIR / repo_name
        if not repo_path.exists() or not (repo_path / '.git').exists():
            continue
        
        log_file = LOGS_DIR / f"{repo_name}.txt"
        try:
            result = subprocess.run(
                ["gource", "--output-custom-log", str(log_file)],
                cwd=str(repo_path),
                capture_output=True,
                text=True,
                check=True
            )
            
            # Préfixer les chemins avec le nom du dépôt
            with open(log_file, 'r') as f:
                content = f.read()
            
            with open(log_file, 'w') as f:
                for line in content.splitlines():
                    parts = line.split('|')
                    if len(parts) >= 2:
                        parts[1] = f"/{repo_name}{parts[1]}"
                        f.write('|'.join(parts) + '\n')
            
            log_files.append(str(log_file))
        except subprocess.CalledProcessError as e:
            return jsonify({"error": f"Error generating log for {repo_name}: {e.stderr}"}), 500
    
    return jsonify({"status": "success", "log_files": log_files})

@app.route('/api/logs/combine', methods=['POST'])
def combine_logs():
    combined_log = LOGS_DIR / "ACombinedLog.txt"
    
    try:
        # Concaténer tous les logs
        with open(combined_log, 'w') as outfile:
            for log_file in LOGS_DIR.glob('*.txt'):
                if log_file.name != "ACombinedLog.txt":
                    with open(log_file, 'r') as infile:
                        outfile.write(infile.read())
        
        # Trier par timestamp
        lines = []
        with open(combined_log, 'r') as f:
            lines = f.readlines()
        
        lines.sort()
        
        # Supprimer les doublons
        unique_lines = []
        for line in lines:
            if line not in unique_lines:
                unique_lines.append(line)
        
        with open(combined_log, 'w') as f:
            f.writelines(unique_lines)
        
        return jsonify({"status": "success", "combined_log": str(combined_log)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/renders', methods=['GET'])
def get_renders():
    try:
        renders = []
        for render_file in RENDERS_DIR.glob('*.mp4'):
            # Dans une implémentation réelle, on extrairait les métadonnées du fichier
            # Pour l'instant, on crée des exemples fictifs
            render_info = {
                "name": render_file.name,
                "path": str(render_file),
                "date": os.path.getmtime(render_file),
                "resolution": "1920x1080",  # À extraire du fichier en réalité
                "duration": "2:30"  # À extraire du fichier en réalité
            }
            renders.append(render_info)
        return jsonify(renders)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/renders/<render_name>', methods=['DELETE'])
def delete_render(render_name):
    render_path = RENDERS_DIR / render_name
    if not render_path.exists():
        return jsonify({"error": f"Render {render_name} not found"}), 404
    
    try:
        os.remove(render_path)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/renders/start', methods=['POST'])
def start_render():
    data = request.json
    log_name = data.get('log')
    options = data.get('options', {})
    
    if not log_name:
        return jsonify({"error": "Log file is required"}), 400
    
    log_path = LOGS_DIR / log_name
    if not log_path.exists():
        return jsonify({"error": f"Log file {log_name} not found"}), 404
    
    output_filename = options.get('outputFilename', 'gource-render')
    resolution = options.get('resolution', '1920x1080')
    seconds_per_day = options.get('secondsPerDay', 8.57)
    fps = options.get('fps', 60)
    hide_items = options.get('hideItems', [])
    
    # Construire les arguments Gource
    gource_args = [
        "gource",
        str(log_path),
        f"--seconds-per-day", str(seconds_per_day),
        f"--viewport", resolution,
        f"--output-ppm-stream", "-"
    ]
    
    # Ajouter les éléments à masquer
    for item in hide_items:
        gource_args.append(f"--hide {item}")
    
    # Construire les arguments FFmpeg
    ffmpeg_args = [
        "ffmpeg",
        "-y",
        "-r", str(fps),
        "-f", "image2pipe",
        "-vcodec", "ppm",
        "-i", "-",
        "-vcodec", "libx264",
        "-preset", options.get('qualityPreset', 'high'),
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-bf", "2",
        str(RENDERS_DIR / f"{output_filename}.mp4")
    ]
    
    # Exécuter la commande (en réalité, cela devrait être fait dans un thread/processus séparé)
    try:
        # Cette logique simule le comportement - dans une implémentation réelle,
        # on utiliserait subprocess avec pipe et traitement asynchrone
        # Ce code est simplifié et ne fonctionnera pas tel quel
        
        return jsonify({
            "status": "success", 
            "message": "Render started",
            "render_file": f"{output_filename}.mp4"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/avatars/download', methods=['POST'])
def download_avatars():
    try:
        # Créer le script temporaire pour télécharger les avatars
        avatar_script = """
#!/usr/bin/perl
use strict;
use warnings;
use LWP::Simple;
use Digest::MD5 qw(md5_hex);
use Parallel::ForkManager;

my $size = 90;
my $output_dir = $ARGV[0] || '.';
my $email = $ARGV[1] || '';

if ($email) {
    # Download single avatar
    download_avatar($email, $output_dir);
} else {
    # Process all repositories
    my @repos = glob("$ARGV[2]/*");
    foreach my $repo (@repos) {
        next unless -d "$repo/.git";
        process_repository($repo, $output_dir);
    }
}

sub process_repository {
    my ($repo_path, $output_dir) = @_;
    
    open(GITLOG, "cd $repo_path && git log --pretty=format:\\\"%ae|%an\\\" |") or die("Failed to read git-log: $!\\n");
    my %authors;
    
    while(<GITLOG>) {
        chomp;
        my ($email, $name) = split(/\\|/, $_);
        $authors{$email} = $name if $email;
    }
    close(GITLOG);
    
    # Create a fork manager
    my $pm = new Parallel::ForkManager(5);
    
    foreach my $email (keys %authors) {
        $pm->start and next;
        download_avatar($email, $output_dir);
        $pm->finish;
    }
    
    $pm->wait_all_children;
}

sub download_avatar {
    my ($email, $output_dir) = @_;
    my $md5 = md5_hex(lc $email);
    my $gravatar_url = "http://www.gravatar.com/avatar/$md5?d=404&s=$size";
    
    my $avatar_file = "$output_dir/$md5.png";
    
    if (getstore($gravatar_url, $avatar_file) == 200) {
        print "Downloaded avatar for $email to $avatar_file\\n";
    } else {
        print "No avatar found for $email\\n";
    }
}
"""
        
        script_path = Path("/tmp/gource_avatar_downloader.pl")
        with open(script_path, 'w') as f:
            f.write(avatar_script)
        
        os.chmod(script_path, 0o755)
        
        # Exécuter le script Perl pour télécharger les avatars
        result = subprocess.run(
            ["perl", str(script_path), str(AVATARS_DIR), "", str(REPOS_DIR)],
            capture_output=True,
            text=True,
            check=True
        )
        
        return jsonify({"status": "success", "message": result.stdout})
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Error downloading avatars: {e.stderr}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/gource/preview', methods=['POST'])
def gource_preview():
    data = request.json
    log_name = data.get('log')
    options = data.get('options', {})
    
    if not log_name:
        return jsonify({"error": "Log file is required"}), 400
    
    log_path = LOGS_DIR / log_name
    if not log_path.exists():
        return jsonify({"error": f"Log file {log_name} not found"}), 404
    
    # Dans une implémentation réelle, on lancerait Gource en mode prévisualisation
    # et on enverrait le flux vidéo au client via WebSockets ou autre
    # Ce code est simplifié et simule seulement la réponse
    
    return jsonify({
        "status": "success",
        "previewUrl": "/api/gource/stream",
        "message": "Preview started"
    })

if __name__ == '__main__':
    app.run(debug=True) 