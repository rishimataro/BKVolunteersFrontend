const fs = require('fs');
const path = require('path');

const replacements = [
    { regex: /bg-\[#0A0A0A\]/g, replacement: 'bg-primary' },
    { regex: /text-\[#0A0A0A\]/g, replacement: 'text-primary' },
    { regex: /border-\[#0A0A0A\]/g, replacement: 'border-primary' },
    { regex: /border-b-\[#0A0A0A\]/g, replacement: 'border-b-primary' },
    
    { regex: /bg-\[#DC2626\]/g, replacement: 'bg-destructive' },
    { regex: /text-\[#DC2626\]/g, replacement: 'text-destructive' },
    { regex: /border-\[#DC2626\]/g, replacement: 'border-destructive' },
    
    { regex: /bg-\[#4B5563\]/g, replacement: 'bg-muted-foreground' },
    { regex: /text-\[#4B5563\]/g, replacement: 'text-muted-foreground' },
    { regex: /border-\[#4B5563\]/g, replacement: 'border-muted-foreground' },
    
    { regex: /bg-\[#F9FAFB\]/g, replacement: 'bg-muted' },
    { regex: /text-\[#F9FAFB\]/g, replacement: 'text-muted' },
    
    { regex: /border-\[#E5E7EB\]/g, replacement: 'border-border' },
    { regex: /border-\[#D1D5DB\]/g, replacement: 'border-input' },

    // Also replace raw hex in style objects if any, though less common
    { regex: /"#0A0A0A"/g, replacement: '"hsl(var(--primary))"' },
    { regex: /"#DC2626"/g, replacement: '"hsl(var(--destructive))"' },
    { regex: /"#4B5563"/g, replacement: '"hsl(var(--muted-foreground))"' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            for (const { regex, replacement } of replacements) {
                content = content.replace(regex, replacement);
            }
            
            if (content !== originalContent) {
                console.log(`Updated: ${fullPath}`);
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Color synchronization complete.');
