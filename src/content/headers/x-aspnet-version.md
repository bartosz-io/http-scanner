---
headerName: x-aspnet-version
description: X-AspNet-Version is non-standard ASP.NET metadata that can disclose a framework version selected by the server handling the response.
applicability: response
syntax: "X-AspNet-Version: <implementation-defined version>"
examples:
  - "X-AspNet-Version: 4.0.30319"
useCases:
  - Detect legacy ASP.NET version disclosure during a configuration review.
  - Compare application and proxy behavior across normal and framework-generated error responses.
commonMistakes:
  - Interpreting the value as authoritative evidence of patch level or operating-system state.
  - Disabling the banner while leaving verbose errors, debug settings, or outdated framework components exposed.
securityConsiderations: Removing version disclosure reduces a convenient fingerprint, but supported framework versions, security updates, and safe error handling remain mandatory.
relatedHeaders:
  - server
  - x-powered-by
  - x-runtime
references:
  - label: Microsoft httpRuntime configuration
    url: https://learn.microsoft.com/en-us/dotnet/api/system.web.configuration.httpruntimesection.enableversionheader
  - label: Microsoft ASP.NET security guidance
    url: https://learn.microsoft.com/en-us/aspnet/web-forms/overview/security/
---
## Meaning and behavior

X-AspNet-Version is a non-standard field historically emitted by ASP.NET to identify a framework version associated with request processing. A value such as `4.0.30319` can help an operator recognize a runtime family, but it is not a dependable patch inventory. Servicing updates can preserve the same displayed runtime number, multiple applications can share infrastructure, and a proxy can remove or replace the field. Its exact behavior is implementation-specific and varies across ASP.NET generations and hosting configurations.

Public version metadata can assist broad fingerprinting, especially when paired with Server, X-Powered-By, cookies, and characteristic error pages. Suppressing the field reduces that easy signal. It does not alter the installed runtime, close a vulnerable endpoint, or prove that the application uses secure framework features. Modern ASP.NET Core deployments also have different middleware and hosting behavior from classic System.Web applications.

## Implementation notes

For classic ASP.NET, review the documented `enableVersionHeader` setting and disable it where compatibility permits. Also configure IIS, reverse proxies, and application middleware because another layer may emit separate banners. Verify successful pages, redirects, authentication failures, custom errors, and unhandled exceptions. Keep framework and operating-system servicing records in internal inventory rather than inferring them from responses. When migrating applications, re-run checks because a new hosting model can remove one field while introducing another. Prioritize supported runtimes, current patches, safe error pages, and least-privilege hosting over cosmetic banner changes.
