// VOX workspace module -- placeholder. Real content lands in Phase 6 of the parent-app plan.
// Not yet loaded from index.html; Phase 1b's workspace switcher will add its <script> tag and
// call mount()/unmount() the same way it does for workspaces/asp.js.
(function(){
  window.Workspaces = window.Workspaces || {};
  window.Workspaces.vox = {
    id: 'vox',
    mount(container){
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-3);">The Vox Group workspace is coming soon.</div>';
    },
    unmount(){},
  };
})();
