## SRE Pull Request Template

### Description
Describe the changes introduced and their impact on self-healing or observability.

### Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds SRE capability)
- [ ] Refinement (code quality or security audit)

### Testing Checklist
- [ ] All Java modules compile via `mvn clean compile`
- [ ] React SPA builds successfully via `npm run build`
- [ ] ESLint style checks pass via `npm run lint`
- [ ] Kubernetes manifests successfully validated
- [ ] Confirmed zero mock or synthetic telemetry logs are introduced
