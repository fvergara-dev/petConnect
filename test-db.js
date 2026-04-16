const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('', '');
async function run() {
const {data:p} = await supabase.from('posts').select('id, author_id, content');
console.log('POSTS:', p);
const {data:pr} = await supabase.from('profiles').select('id, full_name');
console.log('PROFILES:', pr);
}
run();
