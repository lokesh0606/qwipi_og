import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

function Box(props: any) {
    const mesh = useRef<THREE.Mesh>(null)
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)

    useFrame((_state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * 0.2
            mesh.current.rotation.y += delta * 0.2
        }
    })

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh
                {...props}
                ref={mesh}
                scale={active ? 1.5 : 1}
                onClick={() => setActive(!active)}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={hovered ? 'hotpink' : '#2f74c0'} wireframe />
            </mesh>
        </Float>
    )
}

export default function Scene() {
    return (
        <div className="absolute inset-0 -z-10 bg-black">
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Box position={[-1.2, 0, 0]} />
                <Box position={[1.2, 0, 0]} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    )
}
