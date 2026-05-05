import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { record, old_record } = payload
    
    console.log(`📦 Checking Item: ${record.name} | New Qty: ${record.quantity} | Threshold: ${record.low_stock_threshold}`)

    // 2. Logic: Is it low now?
    const isLow = record.quantity <= record.low_stock_threshold
    
    // Logic: Was it already low?
    const wasLow = old_record ? (old_record.quantity <= old_record.low_stock_threshold) : false

    if (!isLow) {
      console.log(`✅ Stock is healthy. No alert needed.`)
      return new Response(JSON.stringify({ message: 'Stock healthy' }), { headers: corsHeaders })
    }
    
    if (wasLow) {
      console.log(`⚠️ Item was ALREADY low. Skipping alert.`)
      return new Response(JSON.stringify({ message: 'Already low' }), { headers: corsHeaders })
    }

    console.log(`🚀 TRIGGERING ALERT! Stock dropped below threshold.`)

    // 3. Connect to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. FIND USERS (Strictly via business_members table)
    // We want Owners AND Managers (and maybe Cashiers, but usually just management)
    const { data: staffMembers, error: staffError } = await supabase
      .from('business_members')
      .select('user_id, role')
      .eq('business_id', record.business_id)
      .in('role', ['owner', 'manager']) // Only notify Owner/Manager
      .eq('is_active', true) // Only active staff

    if (staffError) {
        console.error("🔥 DB Error finding staff:", staffError.message)
        throw staffError
    }

    if (!staffMembers || staffMembers.length === 0) {
       console.log(`⚠️ No active 'owner' or 'manager' found in business_members for ID: ${record.business_id}. Skipping alert.`)
       return new Response(JSON.stringify({ message: 'No staff to notify' }), { headers: corsHeaders })
    }

    const userIds = staffMembers.map(s => s.user_id).filter(id => id !== null)
    if (userIds.length === 0) {
      console.log(`⚠️ Staff found, but user_id is null. Skipping alert.`)
      return new Response(JSON.stringify({ message: 'Staff not fully registered' }), { headers: corsHeaders })
    }
    
    console.log(`👥 Found ${userIds.length} staff members (Owners/Managers) to notify.`)

    // 5. Get Push Tokens
    const { data: tokens } = await supabase
      .from('user_push_tokens')
      .select('token')
      .in('user_id', userIds)

    if (!tokens || tokens.length === 0) {
      console.log(`⚠️ Users found, but no Push Tokens registered.`)
      return new Response(JSON.stringify({ message: 'No devices registered' }), { headers: corsHeaders })
    }

    // Deduplicate tokens
    const uniqueTokens = [...new Set(tokens.map(t => t.token))]

    console.log(`📲 Sending to ${uniqueTokens.length} unique devices...`)

    // 6. Send to Expo
    const notifications = uniqueTokens.map((token) => ({
      to: token,
      sound: 'default',
      title: '⚠️ Low Stock Alert',
      body: `${record.name} is running low! (${record.quantity} ${record.unit} left)`,
      data: { 
          type: 'low_stock',
          businessId: record.business_id,
          inventoryItemId: record.id 
      },
    }))

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
    })

    const expoData = await expoRes.json()
    console.log("📨 Expo Response:", JSON.stringify(expoData))

    if (expoData.errors) {
        console.error("❌ Expo Errors:", expoData.errors)
    }

    return new Response(JSON.stringify({ message: 'Notifications sent!', data: expoData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("🔥 FATAL ERROR:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

