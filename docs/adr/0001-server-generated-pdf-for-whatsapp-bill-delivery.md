# Server-generated PDF for WhatsApp bill delivery

WhatsApp bill delivery needs a backend-controlled document because bills are currently rendered only in the browser. We will generate the bill PDF on the server from persisted bill data after bill creation, then use that server-generated document for WhatsApp upload and template delivery so the flow does not depend on the client tab, device, or manual sharing.
