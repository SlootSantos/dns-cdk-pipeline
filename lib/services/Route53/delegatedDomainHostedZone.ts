import { Construct } from "constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";

import { domains } from "../../constants/domains";

export const buildDelegatedDomainHostedZone = (
  scope: Construct,
  subdomain: string
) => {
  const zone = new HostedZone(scope, "DelegatedDomainHostedZone", {
    zoneName: `${subdomain}.${domains.root}`,
  });

  return zone;
};
