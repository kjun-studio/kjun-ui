import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors, demoPalettes, cssColorName } from '../../shared/demo-colors';
// ?missing leaves out the app's domain colors; otherwise the demo palette supplies them.
if (location.search.includes('missing')) for (const [role, value] of Object.entries(demoPalettes.default)) document.documentElement.style.setProperty(cssColorName(role), value);
else applyDemoColors('default');
const errors: string[] = []; (window as any).domainErrors = errors;
const app = createApp(defineComponent(() => () => <div><K.KjunSignedValue value={0.12} /><K.KjunSparkline data={[1, 3]} /></div>));
app.config.errorHandler = error => { errors.push(String((error as Error).message)); };
app.mount('#root');
