const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'dashboards-raw');
const k8sDir = path.join(__dirname, '..', 'k8s', 'grafana');

const dashboards = [
  'dashboard-1-aiops-overview.json',
  'dashboard-2-gateway-metrics.json',
  'dashboard-3-http-metrics.json',
  'dashboard-4-ai-self-healing.json',
  'dashboard-5-kubernetes.json'
];

let yaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: aiops
data:
`;

dashboards.forEach(file => {
  const rawPath = path.join(rawDir, file);
  if (!fs.existsSync(rawPath)) {
    console.error(`[ERROR] Raw dashboard file not found: ${rawPath}`);
    return;
  }
  const content = fs.readFileSync(rawPath, 'utf8');
  // Indent the JSON file by 4 spaces to conform with YAML multiline block format
  const indented = content.split('\n').map(line => '    ' + line).join('\n');
  yaml += `  ${file}: |\n${indented}\n`;
});

const targetPath = path.join(k8sDir, 'dashboard-configmap.yaml');
fs.writeFileSync(targetPath, yaml, 'utf8');
console.log(`[SUCCESS] Generated single YAML ConfigMap containing all dashboards -> ${targetPath}`);
