import "./CreatePage.css";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { createRoute } from "@/services/routes";
import { useNavigate } from "react-router-dom";
import type { RouteVisibility } from "@/entities/route/types";

const schema = z.object({
  title: z.string().min(2, "Название слишком короткое"),
  city: z.string().min(2, "Укажите город"),
  days: z.coerce.number().int().min(1).max(60),
  visibility: z.enum(["public", "unlisted"]),
});
type FormValues = z.infer<typeof schema>;

export default function CreatePage() {
  const user = useSelector((s: RootState) => s.user.current);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { visibility: "public", days: 3 },
    mode: "onSubmit",
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!user) return;
    try {
      const id = await createRoute({
        title: values.title,
        city: values.city,
        days: values.days,
        visibility: values.visibility as RouteVisibility,
        ownerId: user.uid,
      });
      navigate(`/route/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Не удалось создать маршрут: " + msg);
      console.error("[Create] createRoute failed:", e);
    }
  };

  return (
    <div className="create-wrap">
      <h1 className="create-title">Создать маршрут</h1>

      <form className="create-form" onSubmit={handleSubmit(onSubmit)}>
        <label className="f-label">Название</label>
        <input
          className="f-input"
          {...register("title")}
          placeholder="Тур 3 дня в Стокгольме"
        />
        {errors.title && <div className="f-err">{errors.title.message}</div>}

        <div className="grid2">
          <div>
            <label className="f-label">Город</label>
            <input
              className="f-input"
              {...register("city")}
              placeholder="Стокгольм"
            />
            {errors.city && <div className="f-err">{errors.city.message}</div>}
          </div>
          <div>
            <label className="f-label">Дней</label>
            <input
              className="f-input"
              type="number"
              step={1}
              min={1}
              max={60}
              {...register("days")}
            />
            {errors.days && <div className="f-err">{errors.days.message}</div>}
          </div>
        </div>

        <fieldset className="vis-fieldset">
          <legend>Видимость</legend>
          <label className="vis-option">
            <input type="radio" value="public" {...register("visibility")} />
            <div>
              <div className="vis-title">Публичный</div>
              <div className="vis-desc">
                Показывается в общем списке на главной странице.
              </div>
            </div>
          </label>
          <label className="vis-option">
            <input type="radio" value="unlisted" {...register("visibility")} />
            <div>
              <div className="vis-title">Приватный</div>
              <div className="vis-desc">Доступен только по ссылке.</div>
            </div>
          </label>
        </fieldset>

        <div className="actions">
          <button
            className="btn btn-primary"
            disabled={isSubmitting}
            type="submit"
          >
            Создать
          </button>
        </div>
      </form>
    </div>
  );
}
