import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const navigate = useNavigate();
  const isPrivacy = type === "privacy";

  return (
    <main className="mx-auto min-h-dvh max-w-[520px] bg-canvas px-5 pb-10 pt-[max(24px,env(safe-area-inset-top))]">
      <button className="flex min-h-11 items-center gap-2 text-sm text-muted" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-5 w-5" />
        返回
      </button>
      <article className="mt-5">
        <h1 className="text-[28px] font-semibold">{isPrivacy ? "隐私政策" : "用户协议"}</h1>
        <div className="card mt-7 space-y-5 p-5 text-sm leading-7 text-muted">
          <p className="font-medium text-ink">正式公开前待补充</p>
          {isPrivacy ? (
            <>
              <p>
                当前 MVP 会保存匿名设备账户标识、店名、可选菜名、用餐日期、用餐时间、用餐类型和候选间隔设置。
              </p>
              <p>
                不收集食物图片、用户图片、外卖订单、价格、评分、位置或手机号、邮箱。
              </p>
              <p>用户可在设置页永久删除账户及全部服务端数据。</p>
            </>
          ) : (
            <>
              <p>本工具只根据用户自行记录的历史店铺进行均匀随机抽取，不提供外卖交易或营养建议。</p>
              <p>匿名设备身份无法跨设备恢复。清除浏览器数据后，原记录可能无法再次访问。</p>
              <p>正式服务条款需在公开上线前完成法律审核。</p>
            </>
          )}
        </div>
      </article>
    </main>
  );
}
