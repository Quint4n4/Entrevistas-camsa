import { useQuery } from "@tanstack/react-query";
import { surveyApi } from "../api/survey";

/** Trae la estructura del formulario activo (con cache de TanStack Query). */
export const useSurvey = () =>
  useQuery({ queryKey: ["survey"], queryFn: surveyApi.getForm });
