const previewSourceMap: { [family: string]: string } = {
  '001Shirokuma':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/001Shirokuma.svg',
  '07TetsubinGothic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/07TetsubinGothic.svg',
  '851CHIKARA-DZUYOKU-KANA-B':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/851CHIKARA-DZUYOKU-KANA-B.svg',
  '851Gkkt': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/851Gkkt.svg',
  '851MkPOP': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/851MkPOP.svg',
  'Airstream NF':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Airstream NF.svg',
  Alegreya: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Alegreya.svg',
  AlegreyaSC: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/AlegreyaSC.svg',
  allura: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Allura.svg',
  amethysta: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Amethysta.svg',
  AoyagiKouzanFontT:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/AoyagiKouzanFontT.svg',
  arimo: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Arimo.svg',
  arrow: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Arrow.svg',
  arsenal: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Arsenal.svg',
  AsobiMemogaki:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/AsobiMemogaki.svg',
  BoutiqueBitmap7x7:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/BoutiqueBitmap7x7.svg',
  Carlito: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Carlito.svg',
  carlito: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Carlito.svg',
  CarnivaleeFreakshow:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/CarnivaleeFreakshow.svg',
  CedarvilleCursive:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Cedarville-Cursive.svg',
  'Chanticleer Roman NF':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Chanticleer Roman NF.svg',
  'Chiron Sans HK Pro':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Chiron Sans HK Pro.svg',
  'Chogokuboso Gothic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Chogokuboso Gothic.svg',
  'Comic Neue':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Comic Neue.svg',
  'Corporate Logo Rounded ver2':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Corporate Logo Rounded ver2.svg',
  'courier prime':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Courier Prime.svg',
  DartsFont: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/DartsFont.svg',
  'Dela Gothic One':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Dela Gothic One.svg',
  'Don Graffiti':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Don Graffiti.svg',
  DotGothic16:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/DotGothic16.svg',
  dymaxionscript:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/DymaxionScript.svg',
  Eddie: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Eddie.svg',
  fanzine: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Fanzine.svg',
  fatcow: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/FatCow.svg',
  'fira sans': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Fira Sans.svg',
  Flanella: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Flanella.svg',
  'Gen Jyuu Gothic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Gen Jyuu Gothic.svg',
  'Gen Shin Gothic Monospace':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Gen Shin Gothic Monospace.svg',
  'Gen Shin Gothic P':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Gen Shin Gothic P.svg',
  'Gen Shin Gothic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Gen Shin Gothic.svg',
  'GenEi Gothic M':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenEi Gothic M.svg',
  'GenRyuMin JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenRyuMin JP.svg',
  'GenRyuMin TW':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenRyuMin TW.svg',
  'GenSekiGothic JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenSekiGothic JP.svg',
  'GenSekiGothic TW':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenSekiGothic TW.svg',
  'GenSenRounded JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenSenRounded JP.svg',
  'GenSenRounded TW':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenSenRounded TW.svg',
  'GenWanMin JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenWanMin JP.svg',
  'GenWanMin TW':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenWanMin TW.svg',
  'GenYoGothic JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenYoGothic JP.svg',
  'GenYoGothic TW':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/GenYoGothic TW.svg',
  Genkaimincho:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Genkaimincho.svg',
  'Glow Sans J':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Glow Sans J.svg',
  'Glow Sans SC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Glow Sans SC.svg',
  'Glow Sans TC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Glow Sans TC.svg',
  'Grenadier NF':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Grenadier NF.svg',
  'hachi maru pop':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Hachi Maru Pop.svg',
  HanaMinPlus:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/HanaMinPlus.svg',
  'Huayuan Gothic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Huayuan Gothic.svg',
  'Huiwen-mincho':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Huiwen-mincho.svg',
  'I.Ming': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/I.Ming.svg',
  IPAexMincho:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/IPAexMicho.svg',
  'Impact Label Reversed':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Impact Label Reversed.svg',
  ImpactLabel:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Impact Label.svg',
  Isego: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Isego.svg',
  isemin: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Isemin.svg',
  'josefin sans':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Josefin Sans.svg',
  kawaiitegakimoji:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/KAWAIITEGAKIMOJI.svg',
  Kaisotai: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Kaisotai.svg',
  'Kiwi Maru': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Kiwi Maru.svg',
  'Klee One': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Klee One.svg',
  'Koku Mincho Regular':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Koku Mincho Regular.svg',
  'kong quest':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Kong Quest.svg',
  Kosugi: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Kosugi.svg',
  Lato: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Lato.svg',
  lavigne: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Lavigne.svg',
  'lemon tuesday':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Lemon Tuesday.svg',
  'libre franklin':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Libre Franklin.svg',
  'life savers':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Life Savers.svg',
  'Liu Jian Mao Cao':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Liu Jian Mao Cao.svg',
  lobster: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Lobster.svg',
  'long cang': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Long Cang.svg',
  'M PLUS 1 Code':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/M PLUS 1 Code.svg',
  'M PLUS 1': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/M PLUS 1.svg',
  'm plus 1p': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/M PLUS 1p.svg',
  'M PLUS 2': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/M PLUS 2.svg',
  'M PLUS Code Latin':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/M PLUS Code Latin.svg',
  'M PLUS Rounded 1c':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/M PLUS Rounded 1c.svg',
  'Ma Shan Zheng':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Ma Shan Zheng.svg',
  makinas: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Makinas.svg',
  mamelon: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Mamelon.svg',
  'Modern Sans':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Modern Sans.svg',
  Montserrat: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Montserrat.svg',
  'Mr Bedfort':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Mr Bedfort.svg',
  'mukasi mukasi':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Mukasi Mukasi.svg',
  Mushin: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Mushin.svg',
  'Nagurigaki Crayon':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Nagurigaki Crayon.svg',
  NaikaiFont: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/NaikaiFont.svg',
  'New Tegomin':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/New Tegomin.svg',
  nickainley: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Nickainley.svg',
  'Noto Sans HK':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Sans HK.svg',
  'Noto Sans JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Sans JP.svg',
  'Noto Sans KR':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Sans KR.svg',
  'Noto Sans SC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Sans SC.svg',
  'Noto Sans TC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Sans TC.svg',
  'Noto Sans': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Sans.svg',
  'Noto Serif JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Serif JP.svg',
  'Noto Serif KR':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Serif KR.svg',
  'Noto Serif SC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Serif SC.svg',
  'Noto Serif TC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Serif TC.svg',
  'Noto Serif':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Noto Serif.svg',
  'old standard TT':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Old Standard TT.svg',
  'Oldies Cartoon':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Oldies Cartoon.svg',
  'Open Sans': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Open Sans.svg',
  'Oradano-mincho-GSRR':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Oradano-mincho-GSRR.svg',
  Oswald: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Oswald.svg',
  'Otomanopee One':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Otomanopee One.svg',
  pacifico: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Pacifico.svg',
  'palette Mosaic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Palette Mosaic.svg',
  'Park Lane NF':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Park Lane NF.svg',
  'passengers script':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Passengers Script.svg',
  phantomonia:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Phantomonia.svg',
  'plexifont bv':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Plexifont BV.svg',
  poppins: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Poppins.svg',
  'potta One': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Potta One.svg',
  Radicalis: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Radicalis.svg',
  raustila: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Raustila.svg',
  'reggae One':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Reggae One.svg',
  Rhesmanisa: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Rhesmanisa.svg',
  Riesling: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Riesling.svg',
  robert: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Robert.svg',
  roboto: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Roboto.svg',
  'rocknRoll One':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/RocknRoll One.svg',
  'ronde-B': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Ronde-B.svg',
  Rubik: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Rubik.svg',
  rubik: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Rubik.svg',
  'sawarabi Gothic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Sawarabi Gothic.svg',
  'Sawarabi mincho':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Sawarabi Mincho.svg',
  'Senobi Gothic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Senobi Gothic.svg',
  SetoFont: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/SetoFont.svg',
  shagadelic: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Shagadelic.svg',
  ShigotoMemogaki:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/ShigotoMemogaki.svg',
  'Shippori Mincho B1':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Shippori Mincho B1.svg',
  'Shippori Mincho':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Shippori Mincho.svg',
  SoukouMincho:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/SoukouMincho.svg',
  'Source Serif Pro':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Source Serif Pro.svg',
  STICK: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Stick.svg',
  'Swei Gothic CJK JP':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Swei Gothic CJK JP.svg',
  'Swei Gothic CJK SC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Swei Gothic CJK SC.svg',
  'Swei Gothic CJK TC':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Swei Gothic CJK TC.svg',
  'TW-MOE-Std-Kai':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/TW-MOE-Std-Kai.svg',
  'Tanuki Permanent Marker':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Tanuki Permanent Marker.svg',
  Tinos: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Tinos.svg',
  Togalite: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Togalite.svg',
  'train One': 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Train One.svg',
  'True Crimes':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/True Crimes.svg',
  'volaroid Sans':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Volaroid Sans.svg',
  VolaroidScript:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Volaroid Script.svg',
  yomogi: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Yomogi.svg',
  'Yusei Magic':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Yusei Magic.svg',
  'ZCOOL kuaile':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/ZCOOL KuaiLe.svg',
  'ZCOOL QingKe HuangYou':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/ZCOOL QingKe HuangYou.svg',
  'ZCOOL xiaowei':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/ZCOOL XiaoWei.svg',
  'Zhi Mang Xing':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Zhi Mang Xing.svg',
  'zilla Slab':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/Zilla Slab.svg',
  Aoyagireisyosimo2:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/aoyagireisyosimo2.svg',
  irohamaru: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/irohamaru.svg',
  'jf-openhuninn-1.1':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/jf-openhuninn-1.1.svg',
  'timemachine wa':
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/timemachine wa.svg',
  おつとめフォント:
    'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/おつとめフォント.svg',
  內海字體JP: 'https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/font-preview/NaikaiFont.svg',
};

export default previewSourceMap;
