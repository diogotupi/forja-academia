"use client";
import { useRouter } from "next/navigation";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";
export function LogoutButton(){const router=useRouter();return <button className="logout" onClick={async()=>{await fetch(`${basePath}/api/auth/logout`,{method:"POST"});router.push("/");router.refresh()}}>Sair ↗</button>}
