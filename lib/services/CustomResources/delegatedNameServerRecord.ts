import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { CfnOutput, Fn } from "aws-cdk-lib";
import { IHostedZone } from "aws-cdk-lib/aws-route53";

import { domains } from "../../constants/domains";
import { accounts } from "../../constants/accounts";
import { mainRegion } from "../../constants/regions";
import { NS_CREATION_ROLE_NAME } from "../../constants/roles";

export const buildDelegatedNameServerRecord = (
  scope: Construct,
  subdomain: string,
  hostedZone: IHostedZone
) => {
  const rootHostedZoneId = listHostedZone(scope, subdomain);
  const { nsRecordsForHostedZone, nameServers } = getNameServerList(hostedZone);

  createNameServerRecords(
    scope,
    hostedZone,
    rootHostedZoneId,
    nsRecordsForHostedZone
  );

  return nameServers;
};

// with this custom resource we can list the hosted zones from the root-domain-account
const listHostedZone = (scope: Construct, subdomain: string) => {
  const getRootHostedZoneSDK = {
    service: "Route53",
    action: "listHostedZonesByName",
    physicalResourceId: PhysicalResourceId.fromResponse("HostedZones.0.Id"),
    assumedRoleArn: `arn:aws:iam::${accounts.rootDomain}:role/${NS_CREATION_ROLE_NAME}`,
    parameters: {
      DNSName: `${subdomain}.${domains.root}`,
    },
    region: mainRegion,
  };

  const rootHostedZone = new AwsCustomResource(scope, "list-root-zones", {
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: AwsCustomResourcePolicy.ANY_RESOURCE,
    }),
    onCreate: getRootHostedZoneSDK,
  });

  const rootHostedZoneId = rootHostedZone.getResponseField("HostedZones.0.Id");

  return rootHostedZoneId;
};

// we need to build an array of name servers for the hosted zone
// the list we get from the reference is not a JS array, hence cannot access elements via map or similar
const getNameServerList = (hostedZone: IHostedZone) => {
  const nsRecordsForHostedZone = [];
  const nameServers = [];
  // we can make a fixed assumption here, as Route53 zones always have 4 name servers
  for (let idx = 0; idx < 4; idx++) {
    const fullyQualifiedNameServer =
      Fn.select(idx, hostedZone.hostedZoneNameServers!) + ".";
    const changeRecordSet = {
      // we have to resolve the nameserver token at each index
      Value: fullyQualifiedNameServer,
    };

    nameServers.push(fullyQualifiedNameServer);
    nsRecordsForHostedZone.push(changeRecordSet);
  }

  return { nsRecordsForHostedZone, nameServers };
};

// with this custom resource we can write the NS records to the hosted zone in the root-domain-account
const createNameServerRecords = (
  scope: Construct,
  hostedZone: IHostedZone,
  rootHostedZoneId: string,
  nsRecordsForHostedZone: { Value: string }[]
) => {
  const changeSet = {
    Type: "NS",
    Name: hostedZone.zoneName,
    TTL: 60 * 5, // 5 minutes
    ResourceRecords: nsRecordsForHostedZone,
  };

  const baseParameters = {
    region: mainRegion,
    service: "Route53",
    action: "changeResourceRecordSets",
    physicalResourceId: PhysicalResourceId.of("zone-" + hostedZone.zoneName),
    assumedRoleArn: `arn:aws:iam::${accounts.rootDomain}:role/${NS_CREATION_ROLE_NAME}`,
  };

  const getChangeBatch = (action: "UPSERT" | "DELETE") => ({
    HostedZoneId: rootHostedZoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: action,
          ResourceRecordSet: changeSet,
        },
      ],
    },
  });

  new AwsCustomResource(scope, "custom-resource-create-ns-records", {
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: AwsCustomResourcePolicy.ANY_RESOURCE,
    }),
    onCreate: {
      ...baseParameters,
      parameters: getChangeBatch("UPSERT"),
    },
    onUpdate: {
      ...baseParameters,
      parameters: getChangeBatch("UPSERT"),
    },
    onDelete: {
      ...baseParameters,
      parameters: getChangeBatch("DELETE"),
    },
  });
};
