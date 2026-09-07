export type GrantSnapshot={resourceType:"COURSE"|"EBOOK"|"ALL_ACCESS";resourceId:string|null;status:"ACTIVE"|"REVOKED"|"EXPIRED"|"PENDING";startsAt:Date;expiresAt:Date|null;source:string};
export type ResourceSnapshot={type:"COURSE"|"EBOOK";id:string;includedInAllAccess:boolean;isFree?:boolean};
export function hasEffectiveAccess(grants:GrantSnapshot[],resource:ResourceSnapshot,now=new Date()){
 if(resource.isFree)return true;
 return grants.some(grant=>grant.status==="ACTIVE"&&grant.startsAt<=now&&(!grant.expiresAt||grant.expiresAt>now)&&((grant.resourceType===resource.type&&grant.resourceId===resource.id)||(grant.resourceType==="ALL_ACCESS"&&resource.includedInAllAccess)));
}
