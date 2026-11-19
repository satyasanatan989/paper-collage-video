import React from 'react';
import {Composition} from 'remotion';
import {Collage} from './Collage';
import sb from './storyboard.json';

const portrait = (sb as any).format !== '16:9';
const fps = (sb as any).fps ?? 30;

export const Root: React.FC = () => (
  <Composition
    id="Collage"
    component={Collage}
    fps={fps}
    width={portrait ? 1080 : 1920}
    height={portrait ? 1920 : 1080}
    durationInFrames={Math.ceil((sb as any).duration * fps)}
  />
);
