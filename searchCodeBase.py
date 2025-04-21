import os

def search_word_in_codebase(directory, word):
    # List of common code file extensions
    extensions = (
        '.py', '.js', '.html', '.css', '.cpp', '.java', '.ts', '.rb', '.go', '.php', '.sh', '.swift', '.m',
        '.kt', '.dart', '.r', '.h', '.c', '.lua', '.scala', '.vb', '.pl', '.sql', '.json', '.yaml', '.xml', 
        '.ini', '.md', '.yml', '.xaml'
    )
    
    # Walk through all files in the directory
    for root, dirs, files in os.walk(directory):
        # Skip node_modules directory
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            # Search only files with valid code extensions
            if file.endswith(extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if word in content:
                            print(f"Found '{word}' in {file_path}")
                except Exception as e:
                    # Handle the error if a file can't be opened
                    print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    try:
        # Ask for the word to search
        search_word = input("Enter the word to search for: ")

        # Ask for the directory to search
        codebase_directory = input("Enter the path to the codebase directory: ")

        # Start the search
        search_word_in_codebase(codebase_directory, search_word)

    except Exception as e:
        # Handle any unexpected errors
        print(f"An unexpected error occurred: {e}")
    
    # Wait for user input before closing the script
    input("Press any key to close the script...")
