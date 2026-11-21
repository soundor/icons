import { render, View } from '@soundor/react';

import { Toolbar } from './toolbar';

render(
  <View
    style={{
      flexDirection: 'row',
      gap: 8,
      padding: 8,
      backgroundColor: '#0e0f12',
    }}
  >
    <Toolbar color="#f2f4f7" />
  </View>,
);
