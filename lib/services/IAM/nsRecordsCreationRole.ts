import { Construct } from "constructs";
import {
  Role,
  Effect,
  PolicyDocument,
  PolicyStatement,
  AccountPrincipal,
  CompositePrincipal,
} from "aws-cdk-lib/aws-iam";
import { IHostedZone } from "aws-cdk-lib/aws-route53";

import { accounts } from "../../constants/accounts";
import { NS_CREATION_ROLE_NAME } from "../../constants/roles";

export const buildnsRecordsCreationRole = (
  scope: Construct,
  hostedZone: IHostedZone
) => {
  new Role(scope, "ns-record-creation-role", {
    roleName: NS_CREATION_ROLE_NAME,
    inlinePolicies: {
      createNSRecord: buildRolePolicy(hostedZone),
    },
    // allowing access only from those accounts that we are expecting to write records to the root hosted zone
    assumedBy: new CompositePrincipal(
      new AccountPrincipal(accounts.dev),
      new AccountPrincipal(accounts.prod)
    ),
  });
};

const buildRolePolicy = (hostedZone: IHostedZone) => {
  // required to list the hosted zones in the application stack via the custom resource
  const allowHostedZones = new PolicyStatement({
    resources: ["*"],
    effect: Effect.ALLOW,
    actions: ["route53:ListHostedZonesByName"],
  });

  // required to write the NS record via the custom resource in the application stacks
  const allowChangingHostedZone = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["route53:ChangeResourceRecordSets", "route53:GetHostedZone"],
    resources: [`arn:aws:route53:::hostedzone/${hostedZone.hostedZoneId}`],
  });

  return new PolicyDocument({
    statements: [allowHostedZones, allowChangingHostedZone],
  });
};
