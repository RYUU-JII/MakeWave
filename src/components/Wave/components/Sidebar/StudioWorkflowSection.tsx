import React from 'react';

export const StudioWorkflowSection: React.FC = () => {
    return (
        <section>
            <div className="section-title">Ukiyo-e Workflow</div>
            <ol className="workflow-list">
                <li>레이어 실루엣으로 큰 파형(crest / hollow) 구조를 먼저 만든다.</li>
                <li>Horizon/Thirds 가이드로 주 파도의 위치와 시선을 배치한다.</li>
                <li>포말(Fractal Foam)로 파도 끝의 분열감을 만든다.</li>
                <li>세로무늬(Vertical Rib)로 물결의 결을 정리한다.</li>
                <li>전경/중경/배경 레이어의 opacity·offset·speed로 깊이를 만든다.</li>
            </ol>
        </section>
    );
};
