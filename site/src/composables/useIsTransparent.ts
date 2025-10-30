import { isTransparent } from '@erase2d/fabric';
import { type FabricObject } from 'fabric';
import TransparentWorker from '../worker/transparent.ts?worker';

export function useIsTransparentWorker() {
  const transparentWorker = new TransparentWorker();

  return (target: FabricObject) => isTransparent(target, transparentWorker);
}