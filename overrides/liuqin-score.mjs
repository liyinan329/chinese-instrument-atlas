import {createPluckedScoreEngine} from './ruan-score.mjs';
import {liuqinTechnique,validateLiuqin,planLiuqin} from './liuqin-techniques.mjs';
export const liuqinEngine=createPluckedScoreEngine({technique:liuqinTechnique,validate:validateLiuqin,plan:planLiuqin});
export const liuqinParams=liuqinEngine.params,liuqinPositions=liuqinEngine.positions,analyzeLiuqin=liuqinEngine.analyze,liuqinScoreEvents=liuqinEngine.events;
