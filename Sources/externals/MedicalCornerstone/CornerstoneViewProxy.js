import macro from 'vtk.js/Sources/macro';
import vtkViewProxy from 'vtk.js/Sources/Proxy/Core/ViewProxy';

import vtkCornerstoneRenderer from './CornerstoneRenderer';

const { vtkErrorMacro } = macro;

function CornerstoneViewProxy(publicAPI, model) {
  model.classHierarchy.push('vtkCornerstoneViewProxy');

  // Private ------------------------------------------------------------------

  function updateRenderer() {
    if (!model.container) {
      return;
    }

    const proxy = model.proxyManager.getActiveSource();
    if (!proxy) {
      return;
    }

    const representation = model.proxyManager.getRepresentation(
      proxy,
      publicAPI
    );
    if (!representation) {
      return;
    }

    model.renderer.setRepresentation(representation);
  }

  // Setup --------------------------------------------------------------------

  model.representations = [];
  model.renderer = vtkCornerstoneRenderer.newInstance();

  const unsubscribes = [
    model.proxyManager.onActiveSourceChange(updateRenderer),
  ];

  // Public -------------------------------------------------------------------

  publicAPI.setContainer = (container) => {
    if (model.container === container) {
      return;
    }

    if (model.container) {
      model.renderer.setContainer(null);
    }

    model.container = container;

    if (container) {
      model.renderer.setContainer(container);
      updateRenderer();
    }
  };

  publicAPI.addRepresentation = (representation) => {
    if (representation.getClassName() !== 'vtkCornerstoneRepresentationProxy') {
      vtkErrorMacro('Representation must be a CornerstoneRepresentationProxy');
      return;
    }

    if (model.representations.indexOf(representation) === -1) {
      if (representation.setSlicingMode) {
        // Use IJK instead of XYZ slicing
        representation.setSlicingMode('IJK'[model.axis]);
      }
      model.representations.push(representation);
    }
  };

  publicAPI.removeRepresentation = (representation) => {
    if (!representation) {
      return;
    }
    if (model.representations.indexOf(representation) !== -1) {
      model.representations = model.representations.filter(
        (r) => r !== representation
      );
    }
  };

  publicAPI.resize = () => model.renderer.resize();

  publicAPI.delete = macro.chain(() => {
    while (unsubscribes.length) {
      unsubscribes.pop().unsubscribe();
    }
  }, publicAPI.delete);
}

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(
    model,
    {
      axis: 2,
      orientation: -1,
      viewUp: [0, 1, 0],
      useParallelRendering: true,
    },
    initialValues
  );

  vtkViewProxy.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['axis']);

  CornerstoneViewProxy(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkCornerstoneViewProxy');

export default { newInstance, extend };
