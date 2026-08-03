---
headerName: x-powered-by
description: X-Powered-By is non-standard implementation metadata commonly added by frameworks to identify the application technology serving a response.
applicability: response
syntax: "X-Powered-By: <implementation-defined value>"
examples:
  - "X-Powered-By: Express"
useCases:
  - Detect a framework default that should be disabled in production configuration.
  - Troubleshoot which application tier generated a response inside a controlled environment.
commonMistakes:
  - Assuming removal protects an unpatched framework from targeted exploitation.
  - Stripping the field at one route while framework errors continue to add it elsewhere.
securityConsiderations: Omitting unnecessary framework labels reduces passive fingerprinting, but it offers little protection without timely updates and hardened deployment settings.
relatedHeaders:
  - server
  - x-aspnet-version
  - x-generator
references:
  - label: Express production security guidance
    url: https://expressjs.com/en/advanced/best-practice-security.html
  - label: MDN X-Powered-By glossary context
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
---
## Meaning and behavior

X-Powered-By is a non-standard response field used by several web frameworks and platforms to advertise an implementation name. `Express` is a familiar example, while other stacks emit language, runtime, or vendor labels. There is no governing HTTP definition that makes values comparable across products. Behavior, casing, insertion point, and removal settings are implementation-specific. A proxy can also add or replace the value, so observation does not establish which component executed application code.

The field can make passive technology identification easier, particularly when combined with error pages, asset names, cookies, and behavior. Removing it eliminates one signal but does not conceal a stack reliably and does not change whether a vulnerability is reachable. It should not become a substitute for maintaining dependencies, disabling debug modes, or applying secure framework defaults.

## Implementation notes

Use the framework's documented production option to disable the field as close to its source as practical. In Express, for example, applications can disable `x-powered-by`. A gateway removal rule can provide defense in depth, but test whether upstream errors or alternate services bypass it. Scan successful responses, validation failures, redirects, static content, and unhandled errors. Keep internal observability through logs, deployment metadata, or tracing rather than exposing a public banner for operations. If the field is intentionally retained, document why and avoid adding version strings or environment details that provide no user value.
