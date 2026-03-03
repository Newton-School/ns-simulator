import { SquareDashed } from "lucide-react";

const EmptyFlowState = ({ isEmpty }: { isEmpty: boolean }) => (
 <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none', 
          fontSize: '18px',
          color: 'var(--nss-muted)',

          opacity: isEmpty ? 1 : 0,
          transition: 'opacity 0.1s ease-in-out',
        }}
      >
        <div className="flex flex-col items-center justify-center h-ful">
          <SquareDashed size={30} className="mx-auto mb-2" />
          <p>Drag a node from the library to get started</p>
        </div>
      </div>
);

export default EmptyFlowState;