# Block editing during processing with force-cancel escape hatch

Bills in `processing` will not be editable because only one WhatsApp delivery should be in flight for a bill at a time. When operators need to recover from a stuck delivery, the system will offer a deliberate force-cancel action that ends the in-progress delivery, unlocks bill editing, and allows the updated bill to be resent through the normal delivery flow.
