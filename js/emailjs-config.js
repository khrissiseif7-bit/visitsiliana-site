// ============================================================
//  CONFIG EMAILJS — À REMPLIR   (https://www.emailjs.com — compte gratuit)
//
//  1) Account → General → "Public Key"           -> publicKey
//  2) Email Services → (ajoute Gmail/Outlook…)    -> serviceId
//  3) Email Templates → crée 2 templates :
//       • Template CONTACT   (To Email = contact@visitsiliana.com)  -> templateOwner
//       • Template VISITEUR  (To Email = {{email}})                 -> templateVisitor
//
//  Variables disponibles dans les templates :
//    {{name}}  {{email}}  {{message}}  {{date}}  {{owner_email}}
//
//  Tant que ce n'est pas rempli, le formulaire affiche "Emailing non configuré".
// ============================================================
window.EMAILJS_CONFIG = {
  publicKey:       "fJQ8xmN9bfB-jPYwn",
  serviceId:       "service_r1aytlv",
  templateOwner:   "template_phmdk4a",   // email envoyé AU CONTACT (détails du message)
  templateVisitor: "template_au1r7oi",   // email envoyé AU VISITEUR (accusé de réception)
  ownerEmail:      "mensifakhri3@gmail.com"
};
