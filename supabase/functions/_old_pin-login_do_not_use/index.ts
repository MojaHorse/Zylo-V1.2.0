// supabase/functions/pin-login/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, getNumericDate, Header, Payload } from "https://deno.land/x/djwt@v2.9/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // 1. Handle CORS (Browser pre-flight checks)
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 2. Initialize Admin Client (Bypasses RLS to read hashes)
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // 3. Get the JWT Secret (Crucial for signing the token)
        const jwtSecret = Deno.env.get("JWT_SECRET");
        if (!jwtSecret) {
            throw new Error("Server configuration error: JWT_SECRET is missing");
        }

        // 4. Parse Request
        const { pin } = await req.json();
        if (!pin || pin.length < 4) {
            throw new Error("Invalid PIN format");
        }

        // 5. Fetch all profiles (Small dataset assumption)
        // We fetch all because we can't query by hash directly
        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("*");

        if (profileError) throw profileError;

        // 6. Find the user with the matching PIN hash
        let matchUser = null;
        for (const profile of profiles) {
            if (profile.pin_hash && await bcrypt.compare(pin, profile.pin_hash)) {
                matchUser = profile;
                break;
            }
        }

        if (!matchUser) {
            return new Response(JSON.stringify({ error: "Invalid PIN" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // 7. GENERATE SESSION TOKEN (The Magic Step)
        // We manually mint a token that looks exactly like a Supabase Auth token.

        const encoder = new TextEncoder();
        const keyBuf = encoder.encode(jwtSecret);

        const key = await crypto.subtle.importKey(
            "raw",
            keyBuf,
            { name: "HMAC", hash: "SHA-256" },
            true,
            ["sign", "verify"],
        );

        const payload: Payload = {
            sub: matchUser.id,              // The User's UUID
            aud: "authenticated",           // Audience must be 'authenticated'
            role: "authenticated",          // Role must be 'authenticated' for RLS
            exp: getNumericDate(60 * 60 * 24), // Expires in 24 hours
            app_metadata: {
                provider: "pin",
                providers: ["pin"]
            },
            user_metadata: {
                full_name: matchUser.full_name,
                role: matchUser.role        // 'admin' or 'cashier'
            }
        };

        const header: Header = {
            alg: "HS256",
            typ: "JWT",
        };

        const token = await create(header, payload, key);

        // 8. Return User + Token
        return new Response(JSON.stringify({
            user: matchUser,
            token: token
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});


//supabase secrets set JWT_SECRET=CpizQiokyIHaF2ZjB8K/K3TqtEmBCF+BROpcJ8asOqKMqJVki01DwiAp/9ZE6d8tBT8JYFEtiKXEkzi8tLhHbw==