import type { Metadata } from 'next';
import { LegalPage, type LegalDoc } from '@/components/LegalPage';

export const metadata: Metadata = { title: "Conditions d'utilisation" };

const fr: LegalDoc = {
  title: "Conditions d'utilisation",
  intro: "En créant un compte Boutik, vous acceptez les conditions ci-dessous. Elles sont écrites simplement : n'hésitez pas à nous poser vos questions.",
  sections: [
    {
      h: '1. Le service',
      p: [
        "Boutik est une application de gestion pour petits commerces : ventes, stock, carnet de crédit, dépenses et rapports. Elle fonctionne hors ligne et synchronise vos données lorsqu'une connexion est disponible.",
        "Boutik n'est ni une banque ni un opérateur de mobile money : aucun paiement n'est traité par l'application.",
      ],
    },
    {
      h: '2. Essai gratuit et abonnement',
      p: [
        'Chaque nouvelle boutique bénéficie d’un essai gratuit de 30 jours, sans carte bancaire.',
        'Après l’essai, l’abonnement coûte 5 000 FC ou 2 $ par mois et par boutique. Aucun prélèvement automatique n’est effectué : nous vous contacterons avant la fin de l’essai pour convenir du mode de paiement. Vous pouvez arrêter à tout moment.',
      ],
    },
    {
      h: '3. Votre compte',
      p: [
        'Vous êtes responsable de la confidentialité de votre mot de passe et des accès que vous donnez à vos vendeurs.',
        'Vous restez propriétaire de toutes les données de votre boutique et pouvez demander leur export ou leur suppression.',
      ],
    },
    {
      h: '4. Utilisation acceptable',
      p: ["N'utilisez pas Boutik pour des activités illégales, et n'envoyez pas de messages abusifs à vos clients via les rappels WhatsApp."],
    },
    {
      h: '5. Disponibilité et responsabilité',
      p: [
        "Nous faisons de notre mieux pour que Boutik soit disponible et fiable. Les données non synchronisées sont conservées sur votre appareil : pensez à vous connecter régulièrement à internet pour les sauvegarder.",
        "Boutik est fourni « en l'état » ; notre responsabilité est limitée au montant payé au cours des trois derniers mois.",
      ],
    },
    {
      h: '6. Droit applicable',
      p: ['Ces conditions sont régies par le droit de la République démocratique du Congo. Contact : support@boutik.cd.'],
    },
  ],
};

const ln: LegalDoc = {
  title: 'Mibeko ya kosalela',
  intro: 'Soki ofungoli compte ya Boutik, ondimi mibeko oyo. Ekomami na ndenge ya pete : tuna biso soki ozali na motuna.',
  sections: [
    {
      h: '1. Mosala',
      p: [
        'Boutik ezali application mpo na kokamba mombongo ya moke : biteki, stock, buku ya nyongo, mbongo ebimi mpe lapolo. Esalaka kozanga internet mpe etindaka makambo soki internet ezali.',
        'Boutik ezali banki te mpe opérateur ya mobile money te : application ezwaka mbongo te.',
      ],
    },
    {
      h: '2. Ofele mpe abonnement',
      p: [
        'Butiki moko na moko ya sika ezwaka mikolo 30 ofele, kozanga carte bancaire.',
        'Sima ya ofele, abonnement ezali 5 000 FC to 2 $ na sanza mpo na butiki moko. Tokolongola mbongo yango moko te : tokobenga yo liboso ofele esila. Okoki kotika ntango nyonso.',
      ],
    },
    {
      h: '3. Compte na yo',
      p: ['Ozali na mokumba ya kobatela liloba ya sekele mpe nzela opesaka bateki na yo.', 'Makambo nyonso ya butiki ezali ya yo ; okoki kosenga koyamba yango to kolongola yango.'],
    },
    {
      h: '4. Kosalela malamu',
      p: ['Kosalela Boutik te mpo na misala ya mabe, mpe kotindela basombi te maloba ya mabe na WhatsApp.'],
    },
    {
      h: '5. Mokumba',
      p: [
        'Tosalaka makasi mpo Boutik ezala tango nyonso. Makambo etindami naino te ebombamaka na appareil na yo : kokota na internet mbala na mbala.',
        'Boutik epesami ndenge ezali ; mokumba na biso eleki te mbongo ofutaki na sanza misato ya suka.',
      ],
    },
    {
      h: '6. Mobeko',
      p: ['Mibeko oyo elandi mibeko ya Republiki Demokratiki ya Kongo. Contact : support@boutik.cd.'],
    },
  ],
};

export default function Page() {
  return <LegalPage fr={fr} ln={ln} />;
}
