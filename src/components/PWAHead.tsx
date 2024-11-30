import Head from 'next/head';

export default function PWAHead() {
  return (
    <Head>
      <meta name='application-name' content='Speech to Text App' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      <meta name='apple-mobile-web-app-title' content='Speech App' />
      <meta name='description' content='Convert speech to text using AssemblyAI' />
      <meta name='format-detection' content='telephone=no' />
      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='theme-color' content='#000000' />

      <link rel='apple-touch-icon' sizes='180x180' href='/icons/apple-touch-icon.png' />
      <link rel='manifest' href='/manifest.json' />
      <link rel='shortcut icon' href='/favicon.ico' />
    </Head>
  );
}
