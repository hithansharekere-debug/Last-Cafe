import { reddit } from '@devvit/web/server';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'The Last Cafe on the Internet',
    entry: 'default', // matches devvit.json inline splash entrypoint
  });
};
