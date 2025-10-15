import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';
import { contentSecurityPolicyParser } from './contentSecurityPolicyParser';
import { strictTransportSecurityParser } from './strictTransportSecurityParser';
import { permissionsPolicyParser } from './permissionsPolicyParser';
import { referrerPolicyParser } from './referrerPolicyParser';
import { xContentTypeOptionsParser } from './xContentTypeOptionsParser';
import { crossOriginOpenerPolicyParser } from './crossOriginOpenerPolicyParser';
import { crossOriginEmbedderPolicyParser } from './crossOriginEmbedderPolicyParser';
import { crossOriginResourcePolicyParser } from './crossOriginResourcePolicyParser';
import { xFrameOptionsParser } from './xFrameOptionsParser';
import { clearSiteDataParser } from './clearSiteDataParser';
import { originAgentClusterParser } from './originAgentClusterParser';
import { xPermittedCrossDomainPoliciesParser } from './xPermittedCrossDomainPoliciesParser';
import { xDnsPrefetchControlParser } from './xDnsPrefetchControlParser';

export const securityHeaderParsers: Record<string, HeaderParser> = {
  [contentSecurityPolicyParser.headerName]: contentSecurityPolicyParser,
  [strictTransportSecurityParser.headerName]: strictTransportSecurityParser,
  [permissionsPolicyParser.headerName]: permissionsPolicyParser,
  [referrerPolicyParser.headerName]: referrerPolicyParser,
  [xContentTypeOptionsParser.headerName]: xContentTypeOptionsParser,
  [crossOriginOpenerPolicyParser.headerName]: crossOriginOpenerPolicyParser,
  [crossOriginEmbedderPolicyParser.headerName]: crossOriginEmbedderPolicyParser,
  [crossOriginResourcePolicyParser.headerName]: crossOriginResourcePolicyParser,
  [xFrameOptionsParser.headerName]: xFrameOptionsParser,
  [clearSiteDataParser.headerName]: clearSiteDataParser,
  [originAgentClusterParser.headerName]: originAgentClusterParser,
  [xPermittedCrossDomainPoliciesParser.headerName]: xPermittedCrossDomainPoliciesParser,
  [xDnsPrefetchControlParser.headerName]: xDnsPrefetchControlParser,
};
