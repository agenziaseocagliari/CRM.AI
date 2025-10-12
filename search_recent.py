import os
from datetime import datetime, timedelta
from pathlib import Path

# Search for files modified in last 2 days
cutoff_date = datetime.now() - timedelta(days=2)

search_paths = [
    r"C:\Users\inves\AppData\Roaming\Code\User\workspaceStorage",
    r"C:\Users\inves\AppData\Roaming\Code\Backups", 
    r"C:\Users\inves\AppData\Local\Temp",
    r"C:\Users\inves\AppData\Roaming\Code\User\globalStorage",
    r"C:\Users\inves\AppData\Roaming\Code\User\History",
    r"C:\Users\inves\AppData\Local\Programs\Microsoft VS Code",
    r"C:\Users\inves\.vscode\extensions"
]

recent_files = []

for search_path in search_paths:
    if os.path.exists(search_path):
        print(f"Searching in: {search_path}")
        for root, dirs, files in os.walk(search_path):
            for file in files:
                if file.endswith(('.md', '.sql', '.json', '.txt', '.log')):
                    filepath = os.path.join(root, file)
                    try:
                        mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                        if mtime > cutoff_date:
                            recent_files.append({
                                'path': filepath,
                                'modified': mtime,
                                'size': os.path.getsize(filepath)
                            })
                    except:
                        pass

# Sort by modification date
recent_files.sort(key=lambda x: x['modified'], reverse=True)

print(f"\n=== FOUND {len(recent_files)} FILES MODIFIED SINCE {cutoff_date} ===\n")

# Print results
for f in recent_files[:100]:  # Top 100 most recent
    print(f"{f['modified']} - {f['size']} bytes - {f['path']}")
