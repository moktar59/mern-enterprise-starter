import argon2 from "argon2";
import type {PasswordHasher} from "../../modules/auth/auth.service.js";
export interface Argon2Parameters { readonly timeCost:number; readonly memoryCostKiB:number; readonly parallelism:number; }
/** Argon2id adapter; resource parameters are validated at configuration and injected at composition. */
export class Argon2PasswordHasher implements PasswordHasher {
 constructor(private readonly parameters:Argon2Parameters={timeCost:2,memoryCostKiB:19456,parallelism:1}) {}
 hash(password:string):Promise<string>{return argon2.hash(password,{type:argon2.argon2id,timeCost:this.parameters.timeCost,memoryCost:this.parameters.memoryCostKiB,parallelism:this.parameters.parallelism});}
 async verify(hash:string,password:string):Promise<boolean>{try{return await argon2.verify(hash,password,{type:argon2.argon2id});}catch{return false;}}
}