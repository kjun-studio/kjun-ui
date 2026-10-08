import { createRoot } from 'react-dom/client';
import { Text } from 'react-native';
import * as K from '@kjun-ui/native';
import { InputDesignCases, inputDesignColors, setInputDesignColors } from './input-design-cases';
setInputDesignColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={inputDesignColors}><InputDesignCases K={K} Affix={Text} native /></K.KjunProvider>);
