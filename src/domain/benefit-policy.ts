export function calculateBenefitExpiry(input:{unit:"DAYS"|"LIFETIME"|"CUSTOM_DATE";value:number|null;customDate:Date|null},now=new Date()){
 if(input.unit==="LIFETIME")return null;
 if(input.unit==="CUSTOM_DATE"){if(!input.customDate||input.customDate<=now)throw new Error("Data de expiração inválida");return input.customDate;}
 if(!input.value||input.value<=0)throw new Error("Duração inválida");
 return new Date(now.getTime()+input.value*86_400_000);
}
