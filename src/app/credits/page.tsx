import type { Metadata } from 'next';
import { LegalPage, type LegalDoc } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Crédits photos' };

const PHOTOS: { file: string; url: string }[] = [
  {
    "file": "/img/hero.webp",
    "url": "https://www.pexels.com/photo/4177710/"
  },
  {
    "file": "/img/hero-alt.webp",
    "url": "https://www.pexels.com/photo/4177735/"
  },
  {
    "file": "/img/kiosque.webp",
    "url": "https://www.pexels.com/photo/30019730/"
  },
  {
    "file": "/img/boutique.webp",
    "url": "https://www.pexels.com/photo/30020590/"
  },
  {
    "file": "/img/carnet.webp",
    "url": "https://www.pexels.com/photo/4212951/"
  },
  {
    "file": "/img/telephone.webp",
    "url": "https://www.pexels.com/photo/32644853/"
  },
  {
    "file": "/img/vendeur.webp",
    "url": "https://www.pexels.com/photo/30848031/"
  },
  {
    "file": "/img/marche.webp",
    "url": "https://www.pexels.com/photo/37578355/"
  },
  {
    "file": "/img/marche2.webp",
    "url": "https://www.pexels.com/photo/28594411/"
  },
  {
    "file": "/img/epicerie.webp",
    "url": "https://www.pexels.com/photo/14433577/"
  },
  {
    "file": "/products/riz.webp",
    "url": "https://www.pexels.com/photo/38781904/"
  },
  {
    "file": "/products/farine-mais.webp",
    "url": "https://www.pexels.com/photo/13675717/"
  },
  {
    "file": "/products/huile.webp",
    "url": "https://www.pexels.com/photo/12284682/"
  },
  {
    "file": "/products/sucre.webp",
    "url": "https://www.pexels.com/photo/7965893/"
  },
  {
    "file": "/products/sel.webp",
    "url": "https://www.pexels.com/photo/7717461/"
  },
  {
    "file": "/products/lait-poudre.webp",
    "url": "https://www.pexels.com/photo/10994727/"
  },
  {
    "file": "/products/tomate.webp",
    "url": "https://www.pexels.com/photo/37316395/"
  },
  {
    "file": "/products/sardines.webp",
    "url": "https://www.pexels.com/photo/6901802/"
  },
  {
    "file": "/products/spaghetti.webp",
    "url": "https://www.pexels.com/photo/546945/"
  },
  {
    "file": "/products/soda.webp",
    "url": "https://www.pexels.com/photo/6920721/"
  },
  {
    "file": "/products/biere.webp",
    "url": "https://www.pexels.com/photo/5537952/"
  },
  {
    "file": "/products/eau.webp",
    "url": "https://www.pexels.com/photo/10376368/"
  },
  {
    "file": "/products/pain.webp",
    "url": "https://www.pexels.com/photo/209206/"
  },
  {
    "file": "/products/oeufs.webp",
    "url": "https://www.pexels.com/photo/38912506/"
  },
  {
    "file": "/products/savon.webp",
    "url": "https://www.pexels.com/photo/9475427/"
  },
  {
    "file": "/products/lessive.webp",
    "url": "https://www.pexels.com/photo/10566513/"
  },
  {
    "file": "/products/allumettes.webp",
    "url": "https://www.pexels.com/photo/7111136/"
  },
  {
    "file": "/products/bougies.webp",
    "url": "https://www.pexels.com/photo/39572247/"
  },
  {
    "file": "/products/piles.webp",
    "url": "https://www.pexels.com/photo/38040017/"
  },
  {
    "file": "/products/biscuits.webp",
    "url": "https://www.pexels.com/photo/31909870/"
  },
  {
    "file": "/products/the.webp",
    "url": "https://www.pexels.com/photo/7565515/"
  },
  {
    "file": "/products/cafe.webp",
    "url": "https://www.pexels.com/photo/6781594/"
  },
  {
    "file": "/products/mayonnaise.webp",
    "url": "https://www.pexels.com/photo/8053728/"
  },
  {
    "file": "/products/bouillon.webp",
    "url": "https://www.pexels.com/photo/27397343/"
  },
  {
    "file": "/products/lait-concentre.webp",
    "url": "https://www.pexels.com/photo/28835210/"
  },
  {
    "file": "/products/jus.webp",
    "url": "https://www.pexels.com/photo/9273070/"
  },
  {
    "file": "/products/papier-toilette.webp",
    "url": "https://www.pexels.com/photo/3958205/"
  },
  {
    "file": "/products/dentifrice.webp",
    "url": "https://www.pexels.com/photo/7622555/"
  },
  {
    "file": "/products/arachides.webp",
    "url": "https://www.pexels.com/photo/36107779/"
  },
  {
    "file": "/products/haricots.webp",
    "url": "https://www.pexels.com/photo/4157763/"
  },
  {
    "file": "/products/manioc.webp",
    "url": "https://www.pexels.com/photo/30893342/"
  },
  {
    "file": "/products/poisson-sale.webp",
    "url": "https://www.pexels.com/photo/35078813/"
  },
  {
    "file": "/products/oignons.webp",
    "url": "https://www.pexels.com/photo/38088072/"
  }
];

const list = PHOTOS.map((p) => `${p.file} — ${p.url}`);

const fr: LegalDoc = {
  title: 'Crédits photos',
  intro: "Les photographies utilisées sur Boutik proviennent de Pexels et sont utilisées conformément à la licence Pexels (utilisation gratuite, attribution non obligatoire). Merci aux photographes !",
  sections: [{ h: 'Photos', p: list }],
};
const ln: LegalDoc = {
  title: 'Ba foto',
  intro: 'Ba foto ya Boutik euti na Pexels mpe esalelami na ndenge licence ya Pexels endimi (ofele). Matondi na ba photographe !',
  sections: [{ h: 'Ba foto', p: list }],
};

export default function Page() {
  return <LegalPage fr={fr} ln={ln} />;
}
