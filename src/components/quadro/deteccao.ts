import { pointerWithin, rectIntersection, type CollisionDetection } from "@dnd-kit/core"

export const deteccao: CollisionDetection = (args) => {
  const peloPonteiro = pointerWithin(args)
  return peloPonteiro.length > 0 ? peloPonteiro : rectIntersection(args)
}
