import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";

import { buildnsRecordsCreationRole } from "../services/IAM/nsRecordsCreationRole";
import { buildRootDomainHostedZone } from "../services/Route53/rootDomainHostedZone";

export class RootDomainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedZone = buildRootDomainHostedZone(this);
    buildnsRecordsCreationRole(this, hostedZone);
  }
}
