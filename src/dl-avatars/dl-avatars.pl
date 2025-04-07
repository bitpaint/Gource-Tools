#!/usr/bin/perl
# dl-avatars.pl
#
# Purpose: Downloads avatar images for Git commit authors from Gravatar
# How it works:
# 1. Extracts email addresses and author names from Git commit history
# 2. For each unique author, downloads their avatar image from Gravatar
# 3. Uses parallel processing to improve download performance
# 
# Requirements:
# - Perl modules: LWP::Simple, Digest::MD5, Getopt::Long, Parallel::ForkManager
# - Must be run from within a Git repository directory

use strict;
use warnings;

use LWP::Simple;
use Digest::MD5 qw(md5_hex);
use Getopt::Long;
use Parallel::ForkManager;

# Default configuration
my $size       = 90;  # Avatar image size in pixels
my $output_dir = '../../avatars/raw';  # Directory to save avatars

# Parse command line arguments (optional overrides for defaults)
GetOptions(
    "size=i"       => \$size,          # Integer size in pixels
    "output-dir=s" => \$output_dir,    # Output directory path
) or die("Error in command line arguments\n");

# Verify we're in a Git repository
die("No .git/ directory found in current path\n") unless -d '.git';

# Create output directory if it doesn't exist
mkdir($output_dir) unless -d $output_dir;

# Read Git log to extract author emails and names
open(GITLOG, q/git log --pretty=format:"%ae|%an" |/) or die("Failed to read git-log: $!\n");

my %processed_authors;  # Hash to track processed authors (avoid duplicates)
my @authors;            # Array to store author information

# Process each line from the Git log
while (<GITLOG>) {
    chomp;
    my ($email, $author) = split(/\|/, $_);

    # Skip if we've already processed this author
    next if $processed_authors{$author}++;

    # Store author information for processing
    push @authors, {email => $email, author => $author};
}

close GITLOG;

# Set up parallel processing manager
# Adjust the number (10) based on how many parallel downloads you want
my $fork_manager = Parallel::ForkManager->new(10);

# Process each author in parallel
foreach my $author_info (@authors) {
    my $author = $author_info->{author};
    my $email = $author_info->{email};

    # Fork a new process for this author
    $fork_manager->start and next;

    # Define the output file path for this author's avatar
    my $author_image_file = $output_dir . '/' . $author . '.png';

    # Skip if we already have this author's avatar
    if (-e $author_image_file) {
        $fork_manager->finish;
        next;
    }

    # Construct the Gravatar URL
    # The md5_hex of the lowercase email is the Gravatar identifier
    # d=404 means return a 404 error if no avatar exists (rather than a default image)
    my $grav_url = "http://www.gravatar.com/avatar/" . md5_hex(lc $email) . "?d=404&size=" . $size;

    warn "Downloading '$author' avatar...\n";

    # Download the image from Gravatar
    my $rc = getstore($grav_url, $author_image_file);

    # If download failed (not HTTP 200 OK), remove the file
    if ($rc != 200) {
        unlink($author_image_file);
    }

    # End this child process
    $fork_manager->finish;
}

# Wait for all child processes to complete
$fork_manager->wait_all_children;

