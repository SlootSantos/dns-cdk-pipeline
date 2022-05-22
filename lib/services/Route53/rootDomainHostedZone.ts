import { Construct } from "constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";

import { domains } from "../../constants/domains";

export const buildRootDomainHostedZone = (scope: Construct) => {
  // creating the hosted zone from lookup bc it does already exist in that account
  // alternatively you could create it from scratch, but would need to make sure then that
  // the domain is resolved properly
  const zone = HostedZone.fromLookup(scope, "RootDomainHostedZone", {
    domainName: domains.root,
  });

  return zone;
};
