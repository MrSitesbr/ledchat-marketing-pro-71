exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, whatsapp, age, gender } = data;

    // Validate required fields
    if (!name || !email || !whatsapp || !age || !gender) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get Zapier webhook URL from environment variables
    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    
    if (!zapierWebhookUrl) {
      console.error('ZAPIER_WEBHOOK_URL not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    // Prepare email data
    const emailData = {
      to_email: 'walter@ledmkt.com',
      subject: `Novo Cadastro LedMKT - ${name}`,
      html_content: `
        <h2>Novo usuário cadastrado no LedMKT</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        <p><strong>Idade:</strong> ${age} anos</p>
        <p><strong>Sexo:</strong> ${gender}</p>
        <p><strong>Data do cadastro:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <hr>
        <p><em>Este email foi enviado automaticamente pelo sistema LedMKT.</em></p>
      `,
      timestamp: new Date().toISOString(),
      user_data: { name, email, whatsapp, age, gender }
    };

    // Send to Zapier webhook
    const response = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully' 
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send email' 
      })
    };
  }
};